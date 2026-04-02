import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Auth: Missing email or password");
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
            select: {
              id: true,
              name: true,
              email: true,
              password: true,
              role: true,
              schoolId: true,
              mobile: true,
              photoUrl: true,
              allowedFeatures: true,
              student: { select: { id: true, schoolId: true } },
              assignedClasses: true,
              school: true,
            },
          });

          if (!user) {
            console.log("Auth: User not found for email:", credentials.email);
            return null;
          }

          // Check if password is explicitly null (deactivated account)
          // Only block login if password is null - allow password verification for all other cases
          if (user.password === null) {
            console.log("Auth: User account is deactivated (password is null) for email:", credentials.email);
            throw new Error("Account is deactivated or password not set. Please contact your administrator.");
          }

          // If password is undefined or empty string, treat as invalid credentials
          if (user.password === undefined || user.password === "") {
            console.log("Auth: User has no valid password for email:", credentials.email);
            return null;
          }

          // Verify the password - this will work even if password is a valid hash
          try {
            const isValid = await bcrypt.compare(
              credentials.password,
              user.password
            );

            if (!isValid) {
              console.log("Auth: Password mismatch for user:", credentials.email);
              return null;
            }
          } catch (bcryptError) {
            // If bcrypt.compare fails (e.g., invalid hash format), treat as invalid password
            console.log("Auth: Password verification failed for user:", credentials.email, bcryptError);
            return null;
          }

          console.log("Auth: Successfully authenticated user:", user.email, "Role:", user.role);

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.photoUrl ?? null,
            role: user.role,
            schoolId: user.schoolId,
            mobile: user.mobile,
            studentId: user.student?.id ?? null,
            allowedFeatures: user.allowedFeatures ?? [],
          };
        } catch (error: unknown) {
          const err = error as { code?: string; message?: string };
          console.error("Auth error:", err);
          if (err?.code === "P2022") {
            console.error("Auth: DB schema may be out of sync. Run: npx prisma db push");
          }
          // If it's a custom error message, throw it so it can be displayed to user
          if (err?.message && err.message.includes("Account is deactivated")) {
            throw err;
          }
          return null;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  callbacks: {
  async jwt({ token, user }) {
    // First login
    if (user) {
      token.id = user.id;
      token.role = user.role;
      token.schoolId = user.schoolId;
      token.mobile = user.mobile;
      token.studentId = user.studentId;
      token.allowedFeatures = user.allowedFeatures ?? [];
      token.image = (user as { image?: string | null }).image ?? null;
    }

    // Keep schoolId and allowedFeatures in sync (single query)
    if (token.id) {
      const dbUser = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: {
          schoolId: true,
          allowedFeatures: true,
          photoUrl: true,
          student: { select: { schoolId: true } },
          adminSchools: { select: { id: true } },
          teacherSchools: { select: { id: true } },
        },
      });
      if (dbUser) {
        if (!token.schoolId) {
          token.schoolId =
            dbUser.schoolId ??
            dbUser.student?.schoolId ??
            dbUser.adminSchools?.[0]?.id ??
            dbUser.teacherSchools?.[0]?.id ??
            null;
        }
        if (dbUser.allowedFeatures?.length !== undefined) {
          token.allowedFeatures = dbUser.allowedFeatures;
        }
        token.image = dbUser.photoUrl ?? token.image ?? null;
        token.schoolIsActive = true;
      }
    }

    return token;
  },

  async session({ session, token }) {
    session.user = {
      ...session.user,
      id: token.id as string,
      role: token.role as "SUPERADMIN" | "SCHOOLADMIN" | "TEACHER" | "STUDENT",
      schoolId: token.schoolId as string | null,
      mobile: token.mobile as string | null,
      studentId: token.studentId as string | null,
      allowedFeatures: (token.allowedFeatures as string[]) ?? [],
      schoolIsActive: token.schoolIsActive as boolean | undefined,
      image: (token as { image?: string | null }).image ?? session.user?.image ?? null,
    };

    return session;
  },
},


  pages: {
    signIn: "/admin/login",
  },

  secret: process.env.NEXTAUTH_SECRET,
};
