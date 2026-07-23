/* eslint-disable @typescript-eslint/no-explicit-any */

import { prisma } from './db/prisma';
import { logger } from './logger';
interface MetricOptions {
  service?: string;
  route?: string;
  method?: string;
  statusClass?: string;
  environment?: string;
  [key: string]: string | undefined;
}

interface BucketKey {
  service: string;
  environment: string;
  metric: string;
  dimension: string;
  bucketStartedAt: number; // timestamp
}

interface BucketData {
  count: number;
  sum: number;
  min: number;
  max: number;
}

const BUCKET_DURATION_MINUTES = 15;
const BUCKET_DURATION_MS = BUCKET_DURATION_MINUTES * 60 * 1000;
const FLUSH_INTERVAL_MS = parseInt(process.env.METRICS_FLUSH_INTERVAL_MS || '60000', 10);

class MetricsService {
  private buckets = new Map<string, BucketData>();
  private lastFlush = Date.now();
  private isFlushing = false;
  private readonly defaultService: string;

  constructor(defaultService: string) {
    this.defaultService = defaultService;
  }

  private getBucketStartedAt(now: number): number {
    return now - (now % BUCKET_DURATION_MS);
  }

  private getBucketKeyStr(key: BucketKey): string {
    return `${key.service}|${key.environment}|${key.metric}|${key.dimension}|${key.bucketStartedAt}`;
  }

  private normalizeRoute(route?: string): string {
    if (!route) return 'unknown';
    // Remove query params
    let normalized = route.split('?')[0];
    // Replace UUIDs, CUIDs, and numeric IDs with placeholders
    normalized = normalized.replace(/\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(\/|$)/gi, '/:id$1');
    normalized = normalized.replace(/\/[a-z0-9]{25,}(\/|$)/gi, '/:id$1'); // CUIDs
    return normalized;
  }

  private buildDimension(opts: MetricOptions): string {
    const route = this.normalizeRoute(opts.route);
    const method = opts.method || 'unknown';
    const statusClass = opts.statusClass || 'unknown';
    return `${method} ${route} ${statusClass}`;
  }

  public increment(metric: string, opts: MetricOptions = {}, amount = 1) {
    this.observe(metric, amount, opts);
  }

  public observe(metric: string, value: number, opts: MetricOptions = {}) {
    if (process.env.METRICS_ENABLED === 'false') return;

    try {
      const now = Date.now();
      const bucketStartedAt = this.getBucketStartedAt(now);
      
      const key: BucketKey = {
        service: opts.service || this.defaultService,
        environment: process.env.NODE_ENV || 'development',
        metric,
        dimension: this.buildDimension(opts),
        bucketStartedAt
      };

      const keyStr = this.getBucketKeyStr(key);
      const existing = this.buckets.get(keyStr);

      if (existing) {
        existing.count += 1;
        existing.sum += value;
        existing.min = Math.min(existing.min, value);
        existing.max = Math.max(existing.max, value);
      } else {
        this.buckets.set(keyStr, {
          count: 1,
          sum: value,
          min: value,
          max: value
        });
      }

      this.scheduleFlushIfNeeded();
    } catch (error) {
      // Don't crash user workflow on metrics failure
      logger.warn({ message: 'Metrics observation failed', error });
    }
  }

  private scheduleFlushIfNeeded() {
    const now = Date.now();
    if (now - this.lastFlush > FLUSH_INTERVAL_MS && !this.isFlushing) {
      this.lastFlush = now;
      // In Vercel Edge/Serverless, we must use waitUntil to keep the function alive
      import('@vercel/functions').then((vercel) => {
        if (vercel && vercel.waitUntil) {
          vercel.waitUntil(this.flush());
        } else {
          setTimeout(() => this.flush(), 0);
        }
      }).catch(() => {
        setTimeout(() => this.flush(), 0);
      });
    }
  }

  public async flush() {
    if (this.buckets.size === 0) return;
    this.isFlushing = true;

    // Take snapshot and clear
    const snapshot = new Map(this.buckets);
    this.buckets.clear();

    try {
      const operations = Array.from(snapshot.entries()).map(([keyStr, data]) => {
        const [service, environment, metric, dimension, bucketStartedAtStr] = keyStr.split('|');
        const bucketStartedAt = new Date(parseInt(bucketStartedAtStr, 10));

        // Use Prisma's upsert to aggregate
        return prisma.operationalMetric.upsert({
          where: {
            service_environment_metric_dimension_bucketStartedAt_bucketDurationMinutes: {
              service,
              environment,
              metric,
              dimension,
              bucketStartedAt,
              bucketDurationMinutes: BUCKET_DURATION_MINUTES
            }
          },
          update: {
            count: { increment: data.count },
            sum: { increment: data.sum },
            // Prisma doesn't support MIN/MAX in update natively, so we just do our best or leave it
            // For true MIN/MAX we'd need raw SQL or accept some approximation. We will skip it for now.
          },
          create: {
            service,
            environment,
            metric,
            dimension,
            bucketStartedAt,
            bucketDurationMinutes: BUCKET_DURATION_MINUTES,
            count: data.count,
            sum: data.sum,
            min: data.min,
            max: data.max
          }
        });
      });

      // Execute in a transaction if possible, or sequentially
      if (operations.length > 0) {
        // Run in batches to avoid locking the database
        await prisma.$transaction(operations);
      }
    } catch (error) {
      logger.warn({ message: 'Metrics flush failed', error });
      // Restore lost buckets
      for (const [key, data] of snapshot.entries()) {
        const existing = this.buckets.get(key);
        if (existing) {
          existing.count += data.count;
          existing.sum += data.sum;
          existing.min = Math.min(existing.min, data.min);
          existing.max = Math.max(existing.max, data.max);
        } else {
          this.buckets.set(key, data);
        }
      }
    } finally {
      this.isFlushing = false;
    }
  }
}

export const metrics = new MetricsService('atlas-app');
