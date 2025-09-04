// Conditional import to prevent build-time database connection
let PrismaClient: any;

async function getPrismaClient() {
  if (!PrismaClient) {
    // Only import PrismaClient when actually needed
    const { PrismaClient: PC } = await import("@prisma/client");
    PrismaClient = PC;
  }
  
  if (process.env.NODE_ENV !== "production") {
    if (!global.prismaGlobal) {
      global.prismaGlobal = new PrismaClient();
    }
    return global.prismaGlobal;
  }
  
  return new PrismaClient();
}

declare global {
  var prismaGlobal: any;
}

// Export the function instead of the client
export default getPrismaClient;
