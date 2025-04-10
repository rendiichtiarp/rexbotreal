const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "listgroup",
    aliases: ["listgc", "lgc"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        try {
            const groupData = await ctx.core.groupFetchAllParticipating();
            const groupIds = Object.values(groupData).map(g => g.id);
            
            let text = quote(`Daftar Grup\n\n`);
            let totalMembers = 0;
            let totalAdmins = 0;
            
            // Mengubah groupData menjadi array dan mengurutkannya berdasarkan jumlah anggota
            const sortedGroups = Object.values(groupData).sort((a, b) => {
                const aCount = a.participants?.length || 0;
                const bCount = b.participants?.length || 0;
                return bCount - aCount; // Urutkan dari terbanyak ke terkecil
            });
            
            for (const group of sortedGroups) {
                const groupName = group.subject || "Tanpa Nama";
                const memberCount = group.participants?.length || 0;
                const adminCount = group.participants?.filter(p => p.admin === "admin").length || 0;
                totalMembers += memberCount;
                totalAdmins += adminCount;
                
                text += quote(`${sortedGroups.indexOf(group) + 1}. *${groupName}*\n`) +
                quote(`• ID: ${group.id}\n`) +
                quote(`• Anggota: ${memberCount}\n`) +
                quote(`• Admin: ${adminCount}\n`) +
                quote(`• Dibuat: ${new Date(group.creation * 1000).toLocaleDateString()}\n\n`);
            }
            
            text += quote(`Statistik\n`) +
            quote(`• Total Grup: ${groupIds.length}\n`) +
            quote(`• Total Anggota: ${totalMembers}\n`);
            
            return await ctx.reply(text);
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
}; 