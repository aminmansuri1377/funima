import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, router } from "../../trpc";
import {
  getPagination,
  getTotalPages,
  paginationSchema,
} from "@/lib/pagination";
const blogInputSchema = z.object({
  title: z.string().trim().min(2, "عنوان کوتاه است").max(200),

  slug: z.string().trim().min(2, "Slug کوتاه است").max(200),

  excerpt: z.string().trim().optional(),

  content: z.string().trim().optional(),

  coverImage: z.string().trim().optional(),

  isPublished: z.boolean(),
});
const blogsListInputSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
});
export const panelBlogsRouter = router({
  list: adminProcedure
    .input(blogsListInputSchema)
    .query(async ({ ctx, input }) => {
      const search = input.search?.trim() || undefined;

      const where = search
        ? {
            OR: [
              {
                title: {
                  contains: search,

                  mode: "insensitive" as const,
                },
              },

              {
                slug: {
                  contains: search,

                  mode: "insensitive" as const,
                },
              },

              {
                excerpt: {
                  contains: search,

                  mode: "insensitive" as const,
                },
              },

              {
                author: {
                  fullName: {
                    contains: search,

                    mode: "insensitive" as const,
                  },
                },
              },
            ],
          }
        : {};

      const { skip, take } = getPagination({
        page: input.page,

        pageSize: input.pageSize,
      });

      const [blogs, total] = await Promise.all([
        ctx.prisma.blog.findMany({
          where,

          skip,
          take,

          include: {
            author: {
              select: {
                id: true,
                fullName: true,
                profileImage: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        }),

        ctx.prisma.blog.count({
          where,
        }),
      ]);

      /*
       * content برای list لازم نیست،
       * ولی چون Prisma Json است
       * همان مقدار را نگه می‌داریم.
       */
      return {
        items: blogs,

        pagination: {
          page: input.page,

          pageSize: input.pageSize,

          total,

          totalPages: getTotalPages(total, input.pageSize),
        },
      };
    }),
  getById: adminProcedure
    .input(
      z.object({
        blogId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const blog = await ctx.prisma.blog.findUnique({
        where: {
          id: input.blogId,
        },

        include: {
          author: {
            select: {
              id: true,
              fullName: true,
              profileImage: true,
            },
          },
        },
      });

      if (!blog) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "مقاله پیدا نشد.",
        });
      }

      return {
        ...blog,

        content:
          typeof blog.content === "string"
            ? blog.content
            : JSON.stringify(blog.content ?? ""),
      };
    }),

  create: adminProcedure
    .input(blogInputSchema)
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.blog.findUnique({
        where: {
          slug: input.slug.trim(),
        },
      });

      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "این slug قبلاً استفاده شده است.",
        });
      }

      const blog = await ctx.prisma.blog.create({
        data: {
          title: input.title.trim(),

          slug: input.slug.trim(),

          excerpt: input.excerpt?.trim() || null,

          content: input.content?.trim() || "",

          coverImage: input.coverImage?.trim() || null,

          isPublished: input.isPublished,

          publishedAt: input.isPublished ? new Date() : null,

          author: {
            connect: {
              id: ctx.session.user.id,
            },
          },
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "CREATE_BLOG",

            entity: "Blog",

            entityId: blog.id,

            metadata: {
              title: blog.title,

              slug: blog.slug,

              isPublished: blog.isPublished,
            },
          },
        });
      } catch (error) {
        console.error("[panel.blogs.create] AuditLog:", error);
      }

      return {
        success: true,
        blogId: blog.id,
      };
    }),

  update: adminProcedure
    .input(
      blogInputSchema.extend({
        blogId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.prisma.blog.findUnique({
        where: {
          id: input.blogId,
        },
      });

      if (!existing) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "مقاله پیدا نشد.",
        });
      }

      const slugOwner = await ctx.prisma.blog.findUnique({
        where: {
          slug: input.slug.trim(),
        },
      });

      if (slugOwner && slugOwner.id !== existing.id) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "این slug قبلاً استفاده شده است.",
        });
      }

      const shouldSetPublishedAt = input.isPublished && !existing.isPublished;

      const updated = await ctx.prisma.blog.update({
        where: {
          id: existing.id,
        },

        data: {
          title: input.title.trim(),

          slug: input.slug.trim(),

          excerpt: input.excerpt?.trim() || null,

          content: input.content?.trim() || "",

          coverImage: input.coverImage?.trim() || null,

          isPublished: input.isPublished,

          publishedAt: shouldSetPublishedAt
            ? new Date()
            : input.isPublished
              ? existing.publishedAt
              : null,
        },
      });

      return {
        success: true,
        blog: updated,
      };
    }),

  delete: adminProcedure
    .input(
      z.object({
        blogId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const blog = await ctx.prisma.blog.findUnique({
        where: {
          id: input.blogId,
        },
      });

      if (!blog) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "مقاله پیدا نشد.",
        });
      }

      await ctx.prisma.blog.delete({
        where: {
          id: blog.id,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "DELETE_BLOG",

            entity: "Blog",

            entityId: blog.id,

            metadata: {
              title: blog.title,

              slug: blog.slug,
            },
          },
        });
      } catch (error) {
        console.error("[panel.blogs.delete] AuditLog:", error);
      }

      return {
        success: true,
      };
    }),
});
