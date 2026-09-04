import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 20;

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),

  pageSize: z.number().int().min(10).max(100).default(DEFAULT_PAGE_SIZE),
});

export function getPagination({
  page,
  pageSize,
}: {
  page: number;
  pageSize: number;
}) {
  return {
    skip: (page - 1) * pageSize,

    take: pageSize,
  };
}

export function getTotalPages(total: number, pageSize: number) {
  return Math.max(1, Math.ceil(total / pageSize));
}
