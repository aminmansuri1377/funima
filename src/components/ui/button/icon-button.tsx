"use client";

import { forwardRef } from "react";

import { Button, type ButtonProps } from "./button";

type IconButtonProps = Omit<ButtonProps, "iconOnly"> & {
  "aria-label": string;
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(props, ref) {
    return <Button ref={ref} iconOnly {...props} />;
  },
);
