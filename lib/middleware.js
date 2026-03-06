import { getSession } from "./session";
import { NextResponse } from "next/server";

/**
 * Middleware to validate session and return session data
 */
export async function withAuth(handler, requiredRole = null) {
  return async (request, context) => {
    try {
      const session = await getSession();
      
      if (!session) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 401 }
        );
      }

      // Check role if required
      if (requiredRole && session.role !== requiredRole) {
        return NextResponse.json(
          { error: "Forbidden: Insufficient permissions" },
          { status: 403 }
        );
      }

      // Add session to request context
      request.session = session;
      
      // Call the original handler with the enhanced request
      return await handler(request, context);
    } catch (error) {
      console.error("[v0] Session validation error:", error);
      return NextResponse.json(
        { error: "Session validation failed" },
        { status: 500 }
      );
    }
  };
}

/**
 * Middleware to validate session and return session data with role check
 */
export async function requireAuth(requiredRole = null) {
  return async (request, context) => {
    try {
      const session = await getSession();
      
      if (!session) {
        return {
          authenticated: false,
          error: "Unauthorized",
          status: 401
        };
      }

      // Check role if required
      if (requiredRole && session.role !== requiredRole) {
        return {
          authenticated: false,
          error: "Forbidden: Insufficient permissions",
          status: 403
        };
      }

      return {
        authenticated: true,
        session: session
      };
    } catch (error) {
      console.error("[v0] Session validation error:", error);
      return {
        authenticated: false,
        error: "Session validation failed",
        status: 500
      };
    }
  };
}

/**
 * Utility function to validate and extract session
 */
export async function validateSession(requiredRole = null) {
  try {
    const session = await getSession();
    
    if (!session) {
      return {
        valid: false,
        error: "Unauthorized",
        status: 401
      };
    }

    // Check role if required
    if (requiredRole && session.role !== requiredRole) {
      return {
        valid: false,
        error: "Forbidden: Insufficient permissions",
        status: 403
      };
    }

    return {
      valid: true,
      session: session
    };
  } catch (error) {
    console.error("[v0] Session validation error:", error);
    return {
      valid: false,
      error: "Session validation failed",
      status: 500
    };
  }
}