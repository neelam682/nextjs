// Temporary fake DB for testing
export const db = {
    companion: {
        create: async (args: any) => {
            console.log("Fake DB create called:", args)
            return args.data
        }
    }
}
