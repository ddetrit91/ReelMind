import type { NextRequest } from "next/server";

import { app } from "@/server/hono/app";

type NextHandler = (
  req: NextRequest | Request,
  context?: { params: Promise<{ route?: string[] }> },
) => Response | Promise<Response>;

const handler: NextHandler = (req) => app.fetch(req);

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
export const OPTIONS = handler;
