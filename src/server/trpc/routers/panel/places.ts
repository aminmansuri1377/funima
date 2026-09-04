import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  getPagination,
  getTotalPages,
  paginationSchema,
} from "@/lib/pagination";
import { adminProcedure, router } from "../../trpc";
import { PlaceType } from "@/generated/prisma/client";
const createPlaceSchema = z.object({
  hostId: z.string().min(1),

  placeName: z.string().trim().min(2, "نام مکان کوتاه است").max(150),

  placePhone: z.string().trim().optional(),

  placeType: z.enum(PlaceType),

  placeProvince: z.string().trim().min(1, "استان الزامی است."),

  placeCity: z.string().trim().min(1, "شهر الزامی است."),
  instagramId: z.string().trim().optional(),

  description: z.string().trim().optional(),
});
const placesListInputSchema = paginationSchema.extend({
  search: z.string().trim().optional(),
});
export const panelPlacesRouter = router({
  list: adminProcedure
    .input(placesListInputSchema)
    .query(async ({ ctx, input }) => {
      const search = input.search?.trim() || undefined;

      const where = search
        ? {
            OR: [
              {
                placeName: {
                  contains: search,

                  mode: "insensitive" as const,
                },
              },

              {
                placeProvince: {
                  contains: search,

                  mode: "insensitive" as const,
                },
              },

              {
                placeCity: {
                  contains: search,

                  mode: "insensitive" as const,
                },
              },

              {
                host: {
                  user: {
                    fullName: {
                      contains: search,

                      mode: "insensitive" as const,
                    },
                  },
                },
              },

              {
                host: {
                  user: {
                    phoneNumber: {
                      contains: search,
                    },
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

      const [items, total] = await Promise.all([
        ctx.prisma.place.findMany({
          where,

          skip,
          take,

          include: {
            host: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    phoneNumber: true,
                  },
                },
              },
            },

            images: {
              orderBy: {
                sortOrder: "asc",
              },

              take: 1,

              select: {
                id: true,
                url: true,
                sortOrder: true,
              },
            },

            _count: {
              select: {
                events: true,
                comments: true,
              },
            },
          },

          orderBy: {
            createdAt: "desc",
          },
        }),

        ctx.prisma.place.count({
          where,
        }),
      ]);

      return {
        items,

        pagination: {
          page: input.page,

          pageSize: input.pageSize,

          total,

          totalPages: getTotalPages(total, input.pageSize),
        },
      };
    }),
  availableHosts: adminProcedure.query(async ({ ctx }) => {
    return ctx.prisma.host.findMany({
      where: {
        place: null,
      },

      select: {
        id: true,

        user: {
          select: {
            id: true,
            fullName: true,
            phoneNumber: true,
          },
        },
      },

      orderBy: {
        user: {
          fullName: "asc",
        },
      },
    });
  }),

  create: adminProcedure
    .input(createPlaceSchema)
    .mutation(async ({ ctx, input }) => {
      const host = await ctx.prisma.host.findUnique({
        where: {
          id: input.hostId,
        },

        include: {
          place: true,

          user: {
            select: {
              id: true,
              fullName: true,
              phoneNumber: true,
            },
          },
        },
      });

      if (!host) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "میزبان پیدا نشد.",
        });
      }

      if (host.place) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "این میزبان قبلاً دارای مکان است.",
        });
      }

      const place = await ctx.prisma.place.create({
        data: {
          hostId: host.id,

          placeName: input.placeName.trim(),

          placePhone: input.placePhone?.trim() || null,

          placeType: input.placeType,

          placeProvince: input.placeProvince.trim(),

          placeCity: input.placeCity.trim(),

          instagramId: input.instagramId?.trim() || null,

          description: input.description?.trim() || null,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "CREATE_PLACE",

            entity: "Place",

            entityId: place.id,

            metadata: {
              placeName: place.placeName,

              placeType: place.placeType,

              hostId: host.id,

              hostUserId: host.user.id,

              hostPhoneNumber: host.user.phoneNumber,
            },
          },
        });
      } catch (error) {
        /*
         * Audit failure should not make
         * the user think Place creation
         * itself failed.
         *
         * We log it server-side.
         */
        console.error("[panel.places.create] AuditLog failed:", error);
      }

      return {
        success: true,
        placeId: place.id,
      };
    }),

  delete: adminProcedure
    .input(
      z.object({
        placeId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      await ctx.prisma.$transaction(async (tx) => {
        const place = await tx.place.findUnique({
          where: {
            id: input.placeId,
          },

          include: {
            host: {
              include: {
                user: true,
              },
            },

            _count: {
              select: {
                events: true,
              },
            },
          },
        });

        if (!place) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "مکان پیدا نشد.",
          });
        }

        if (place._count.events > 0) {
          throw new TRPCError({
            code: "PRECONDITION_FAILED",
            message:
              "این مکان دارای رویداد است. ابتدا رویدادهای آن را حذف کنید.",
          });
        }

        await tx.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "DELETE_PLACE",

            entity: "Place",

            entityId: place.id,

            metadata: {
              placeName: place.placeName,

              hostId: place.hostId,

              hostPhoneNumber: place.host.user.phoneNumber,
            },
          },
        });

        await tx.place.delete({
          where: {
            id: place.id,
          },
        });
      });

      return {
        success: true,
      };
    }),
  getById: adminProcedure
    .input(
      z.object({
        placeId: z.string().min(1),
      }),
    )
    .query(async ({ ctx, input }) => {
      const place = await ctx.prisma.place.findUnique({
        where: {
          id: input.placeId,
        },

        include: {
          host: {
            include: {
              user: {
                select: {
                  id: true,
                  fullName: true,
                  phoneNumber: true,
                },
              },
            },
          },

          location: true,

          images: {
            orderBy: {
              sortOrder: "asc",
            },
          },
        },
      });

      if (!place) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "مکان پیدا نشد.",
        });
      }

      return place;
    }),

  update: adminProcedure
    .input(
      z.object({
        placeId: z.string().min(1),

        placeName: z.string().trim().min(2),

        placePhone: z.string().trim().optional(),

        placeType: z.enum(PlaceType),

        placeProvince: z.string().trim().min(1),

        placeCity: z.string().trim().min(1),
        instagramId: z.string().trim().optional(),

        description: z.string().trim().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const place = await ctx.prisma.place.findUnique({
        where: {
          id: input.placeId,
        },
      });

      if (!place) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "مکان پیدا نشد.",
        });
      }

      const updated = await ctx.prisma.place.update({
        where: {
          id: input.placeId,
        },

        data: {
          placeName: input.placeName.trim(),

          placePhone: input.placePhone?.trim() || null,

          placeType: input.placeType,

          placeProvince: input.placeProvince.trim(),

          placeCity: input.placeCity.trim(),
          instagramId: input.instagramId?.trim() || null,

          description: input.description?.trim() || null,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "UPDATE_PLACE",

            entity: "Place",

            entityId: updated.id,

            metadata: {
              placeName: updated.placeName,

              placeType: updated.placeType,
            },
          },
        });
      } catch (error) {
        console.error("[panel.places.update] AuditLog failed:", error);
      }

      return {
        success: true,
        place: updated,
      };
    }),
  locationUpsert: adminProcedure
    .input(
      z.object({
        placeId: z.string().min(1),

        title: z.string().trim().optional(),

        address: z.string().trim().optional(),

        latitude: z.number(),
        longitude: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const place = await ctx.prisma.place.findUnique({
        where: {
          id: input.placeId,
        },

        select: {
          id: true,
          locationId: true,
          placeName: true,
        },
      });

      if (!place) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "مکان پیدا نشد.",
        });
      }

      let locationId = place.locationId;

      if (locationId) {
        await ctx.prisma.location.update({
          where: {
            id: locationId,
          },

          data: {
            title: input.title?.trim() || null,

            address: input.address?.trim() || null,

            latitude: input.latitude,

            longitude: input.longitude,
          },
        });
      } else {
        const location = await ctx.prisma.location.create({
          data: {
            title: input.title?.trim() || null,

            address: input.address?.trim() || null,

            latitude: input.latitude,

            longitude: input.longitude,
          },
        });

        locationId = location.id;

        await ctx.prisma.place.update({
          where: {
            id: place.id,
          },

          data: {
            locationId,
          },
        });
      }

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "UPSERT_PLACE_LOCATION",

            entity: "Place",

            entityId: place.id,

            metadata: {
              placeName: place.placeName,

              locationId,

              latitude: input.latitude,

              longitude: input.longitude,
            },
          },
        });
      } catch (error) {
        console.error("[panel.places.locationUpsert] AuditLog failed:", error);
      }

      return {
        success: true,
        locationId,
      };
    }),
  deleteImage: adminProcedure
    .input(
      z.object({
        imageId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const image = await ctx.prisma.placeImage.findUnique({
        where: {
          id: input.imageId,
        },

        include: {
          place: true,
        },
      });

      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "تصویر پیدا نشد.",
        });
      }

      const { supabaseAdmin, storageBucket } =
        await import("@/server/supabase/storage");

      /*
       * public URL:
       *
       * https://PROJECT.supabase.co/
       * storage/v1/object/public/places/
       * places/PLACE_ID/UUID.webp
       *
       * bucket = places
       *
       * path داخل bucket باید فقط:
       * places/PLACE_ID/UUID.webp
       */
      const bucketMarker = `/storage/v1/object/public/${storageBucket}/`;

      const markerIndex = image.url.indexOf(bucketMarker);

      if (markerIndex === -1) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "مسیر فایل تصویر در Storage قابل تشخیص نیست.",
        });
      }

      const storagePath = decodeURIComponent(
        image.url.slice(markerIndex + bucketMarker.length),
      );

      const removeResult = await supabaseAdmin.storage
        .from(storageBucket)
        .remove([storagePath]);

      if (removeResult.error) {
        console.error(
          "[panel.places.deleteImage] Storage delete failed:",
          removeResult.error,
        );

        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "حذف فایل از Storage انجام نشد.",
        });
      }

      /*
       * وقتی Storage با موفقیت حذف شد،
       * رکورد DB را حذف می‌کنیم.
       */
      await ctx.prisma.placeImage.delete({
        where: {
          id: image.id,
        },
      });

      try {
        await ctx.prisma.auditLog.create({
          data: {
            adminId: ctx.session.user.id,

            action: "DELETE_PLACE_IMAGE",

            entity: "PlaceImage",

            entityId: image.id,

            metadata: {
              placeId: image.placeId,

              storagePath,

              url: image.url,
            },
          },
        });
      } catch (error) {
        console.error("[panel.places.deleteImage] AuditLog failed:", error);
      }

      return {
        success: true,
      };
    }),
});
