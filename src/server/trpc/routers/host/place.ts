import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { PlaceType } from "@/generated/prisma/client";

import { hostProcedure } from "../../procedures/host";

import { router } from "../../trpc";
import { storageBucket, supabaseAdmin } from "@/server/supabase/storage";

const placeFieldsSchema = z.object({
  placeName: z
    .string()
    .trim()
    .min(2, "نام مکان الزامی است.")
    .max(150, "نام مکان بیش از حد طولانی است."),

  placePhone: z.string().trim().optional(),

  placeType: z.nativeEnum(PlaceType),

  placeProvince: z.string().trim().min(1, "استان الزامی است."),

  placeCity: z.string().trim().min(1, "شهر الزامی است."),

  instagramId: z.string().trim().optional(),

  description: z.string().trim().optional(),
});

const locationSchema = z.object({
  title: z.string().trim().optional(),

  address: z.string().trim().optional(),

  latitude: z.number().finite(),

  longitude: z.number().finite(),
});

async function getHostOrThrow(ctx: {
  prisma: any;

  session: {
    user: {
      id: string;
    };
  };
}) {
  const host = await ctx.prisma.host.findUnique({
    where: {
      userId: ctx.session.user.id,
    },

    select: {
      id: true,
      userId: true,

      user: {
        select: {
          id: true,
          fullName: true,
          phoneNumber: true,
          profileImage: true,
        },
      },
    },
  });

  if (!host) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "پروفایل میزبان پیدا نشد.",
    });
  }

  return host;
}

async function getPlaceOrThrow(ctx: {
  prisma: any;

  session: {
    user: {
      id: string;
    };
  };
}) {
  const host = await getHostOrThrow(ctx);

  const place = await ctx.prisma.place.findUnique({
    where: {
      hostId: host.id,
    },
  });

  if (!place) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "مکان شما پیدا نشد.",
    });
  }

  return {
    host,
    place,
  };
}

export const hostPlaceRouter = router({
  /*
   * اطلاعات کلی Host و وضعیت Place.
   *
   * این API برای صفحه اصلی /host
   * خیلی کاربردی است.
   */
  overview: hostProcedure.query(async ({ ctx }) => {
    const host = await getHostOrThrow(ctx);

    const place = await ctx.prisma.place.findUnique({
      where: {
        hostId: host.id,
      },

      select: {
        id: true,
        placeName: true,
        placeProvince: true,
        placeCity: true,
        placeType: true,

        images: {
          orderBy: {
            sortOrder: "asc",
          },

          take: 1,

          select: {
            id: true,
            url: true,
          },
        },

        _count: {
          select: {
            events: true,
            comments: true,
            savedBy: true,
          },
        },
      },
    });

    return {
      host,
      place,
      hasPlace: Boolean(place),
    };
  }),

  /*
   * دریافت کامل Place خود Host.
   *
   * اگر هنوز Place ندارد null
   * برمی‌گرداند.
   */
  getMine: hostProcedure.query(async ({ ctx }) => {
    const host = await getHostOrThrow(ctx);

    const place = await ctx.prisma.place.findUnique({
      where: {
        hostId: host.id,
      },

      include: {
        host: {
          select: {
            id: true,

            user: {
              select: {
                id: true,
                fullName: true,
                phoneNumber: true,
                profileImage: true,
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

        filterValues: {
          include: {
            filterValue: {
              include: {
                filter: true,
              },
            },
          },

          orderBy: {
            createdAt: "asc",
          },
        },

        _count: {
          select: {
            events: true,
            comments: true,
            savedBy: true,
          },
        },
      },
    });

    return place;
  }),

  /*
   * مرحله اول ساخت Place.
   *
   * Host اگر قبلاً Place داشته باشد
   * اجازه ساخت Place دوم ندارد.
   */
  create: hostProcedure
    .input(placeFieldsSchema)
    .mutation(async ({ ctx, input }) => {
      const host = await getHostOrThrow(ctx);

      const existingPlace = await ctx.prisma.place.findUnique({
        where: {
          hostId: host.id,
        },

        select: {
          id: true,
        },
      });

      if (existingPlace) {
        throw new TRPCError({
          code: "CONFLICT",

          message: "برای این حساب قبلاً یک مکان ثبت شده است.",
        });
      }

      try {
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

          select: {
            id: true,
            placeName: true,
            placeProvince: true,
            placeCity: true,
            placeType: true,
          },
        });

        return {
          success: true,
          place,
        };
      } catch (error) {
        /*
         * hostId در Prisma @unique است.
         * بنابراین حتی اگر دو request
         * همزمان برسند، DB مانع Place دوم می‌شود.
         */
        if (
          error &&
          typeof error === "object" &&
          "code" in error &&
          error.code === "P2002"
        ) {
          throw new TRPCError({
            code: "CONFLICT",

            message: "برای این حساب قبلاً یک مکان ثبت شده است.",
          });
        }

        throw error;
      }
    }),

  /*
   * ویرایش اطلاعات اصلی Place.
   *
   * placeId از Client دریافت نمی‌کنیم.
   * چون Host فقط Place خودش را می‌تواند
   * ویرایش کند.
   */
  update: hostProcedure
    .input(placeFieldsSchema)
    .mutation(async ({ ctx, input }) => {
      const { place } = await getPlaceOrThrow(ctx);

      const updated = await ctx.prisma.place.update({
        where: {
          id: place.id,
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

        select: {
          id: true,
          placeName: true,
          placeProvince: true,
          placeCity: true,
          placeType: true,
        },
      });

      return {
        success: true,
        place: updated,
      };
    }),

  /*
   * ساخت یا ویرایش Location.
   */
  locationUpsert: hostProcedure
    .input(locationSchema)
    .mutation(async ({ ctx, input }) => {
      const { place } = await getPlaceOrThrow(ctx);

      if (place.locationId) {
        const location = await ctx.prisma.location.update({
          where: {
            id: place.locationId,
          },

          data: {
            title: input.title?.trim() || null,

            address: input.address?.trim() || null,

            latitude: input.latitude,

            longitude: input.longitude,
          },
        });

        return {
          success: true,
          location,
        };
      }

      /*
       * دو query ساده.
       * Interactive transaction استفاده نمی‌کنیم.
       */
      const location = await ctx.prisma.location.create({
        data: {
          title: input.title?.trim() || null,

          address: input.address?.trim() || null,

          latitude: input.latitude,

          longitude: input.longitude,
        },
      });

      try {
        await ctx.prisma.place.update({
          where: {
            id: place.id,
          },

          data: {
            locationId: location.id,
          },
        });
      } catch (error) {
        /*
         * اگر اتصال Location به Place شکست خورد،
         * Location orphan باقی نماند.
         */
        await ctx.prisma.location.delete({
          where: {
            id: location.id,
          },
        });

        throw error;
      }

      return {
        success: true,
        location,
      };
    }),

  /*
   * فیلترها + انتخاب‌های فعلی Host.
   */
  filterOptions: hostProcedure.query(async ({ ctx }) => {
    const { place } = await getPlaceOrThrow(ctx);

    const [filters, selectedValues] = await Promise.all([
      ctx.prisma.filter.findMany({
        include: {
          values: {
            orderBy: {
              name: "asc",
            },
          },
        },

        orderBy: {
          name: "asc",
        },
      }),

      ctx.prisma.placeFilterValue.findMany({
        where: {
          placeId: place.id,
        },

        select: {
          filterValueId: true,
        },
      }),
    ]);

    return {
      filters,

      selectedIds: selectedValues.map(
        (item: { filterValueId: string }) => item.filterValueId,
      ),
    };
  }),

  /*
   * ذخیره FilterValueهای انتخابی.
   */
  setFilterValues: hostProcedure
    .input(
      z.object({
        filterValueIds: z.array(z.string().min(1)),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { place } = await getPlaceOrThrow(ctx);

      const filterValueIds = Array.from(new Set(input.filterValueIds));

      if (filterValueIds.length > 0) {
        const count = await ctx.prisma.filterValue.count({
          where: {
            id: {
              in: filterValueIds,
            },
          },
        });

        if (count !== filterValueIds.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",

            message: "یک یا چند ویژگی انتخاب‌شده معتبر نیست.",
          });
        }
      }

      await ctx.prisma.placeFilterValue.deleteMany({
        where: {
          placeId: place.id,
        },
      });

      if (filterValueIds.length > 0) {
        await ctx.prisma.placeFilterValue.createMany({
          data: filterValueIds.map((filterValueId) => ({
            placeId: place.id,

            filterValueId,
          })),

          skipDuplicates: true,
        });
      }

      return {
        success: true,
      };
    }),
  deleteImage: hostProcedure
    .input(
      z.object({
        imageId: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { place } = await getPlaceOrThrow(ctx);

      const image = await ctx.prisma.placeImage.findFirst({
        where: {
          id: input.imageId,

          placeId: place.id,
        },
      });

      if (!image) {
        throw new TRPCError({
          code: "NOT_FOUND",

          message: "تصویر پیدا نشد.",
        });
      }

      const marker = `/storage/v1/object/public/${process.env.SUPABASE_STORAGE_BUCKET}/`;

      const storagePath = image.url.includes(marker)
        ? image.url.split(marker)[1]
        : null;

      if (storagePath) {
        const result = await supabaseAdmin.storage
          .from(storageBucket)
          .remove([storagePath]);

        if (result.error) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",

            message: "حذف تصویر از Storage انجام نشد.",
          });
        }
      }

      await ctx.prisma.placeImage.delete({
        where: {
          id: image.id,
        },
      });

      return {
        success: true,
      };
    }),
  /*
   * حذف Place را فعلاً برای Host باز نمی‌کنیم.
   *
   * طبق Figma فعلی Host ویرایش مکان دارد،
   * اما حذف کامل کسب‌وکار تصمیم حساس‌تری است.
   * بعداً اگر خواستیم با Confirmation Flow
   * جدا اضافه می‌کنیم.
   */
});
