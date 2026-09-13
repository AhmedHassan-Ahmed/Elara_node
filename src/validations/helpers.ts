import { z } from "zod";

/**
 * Parses and normalizes boolean inputs for both JSON payloads and multipart/form-data requests.
 * Handles boolean true/false, string "true"/"false" (case-insensitive), and 1/0.
 * Rejects invalid non-boolean strings like "foo" without coercing them to truthy.
 */
export const zodCoerceBoolean = z.preprocess(
  (val) => {
    if (typeof val === "boolean") return val;
    if (typeof val === "string") {
      const trimmed = val.trim().toLowerCase();
      if (trimmed === "true" || trimmed === "1") return true;
      if (trimmed === "false" || trimmed === "0") return false;
    }
    if (typeof val === "number") {
      if (val === 1) return true;
      if (val === 0) return false;
    }
    return val;
  },
  z.boolean({ invalid_type_error: "Expected boolean, received invalid value" }),
);
