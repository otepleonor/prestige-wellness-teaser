import { createRouteHandlers } from "./routes";
import { getAuthRuntime } from "./runtime";

/** Production handlers bound to the environment-configured runtime (created lazily on first request). */
export const handlers = createRouteHandlers(getAuthRuntime);
