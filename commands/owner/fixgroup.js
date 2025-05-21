const {
    quote
} = require("@mengkodingan/ckptw");

module.exports = {
    name: "fixgroup",
    aliases: ["fixgc", "fgc"],
    category: "owner",
    permissions: {
        owner: true
    },
    code: async (ctx) => {
        try {
            const groupData = await ctx.core.groupFetchAllParticipating();
            let text = quote(`🔍 Memeriksa grup dengan anggota ≤ 2...\n\n`);
            let leaveCount = 0;
            
            // Mengubah groupData menjadi array
            const groups = Object.values(groupData);
            
            for (const group of groups) {
                const groupName = group.subject || "Tanpa Nama";
                const memberCount = group.participants?.length || 0;
                
                if (memberCount <= 2) {
                    try {
                        await ctx.core.groupLeave(group.id);
                        text += quote(`✅ Keluar dari grup: *${groupName}*\n`) +
                        quote(`• ID: ${group.id}\n`) +
                        quote(`• Anggota: ${memberCount}\n\n`);
                        leaveCount++;
                    } catch (error) {
                        text += quote(`❌ Gagal keluar dari grup: *${groupName}*\n`) +
                        quote(`• ID: ${group.id}\n`) +
                        quote(`• Error: ${error.message}\n\n`);
                    }
                }
            }
            
            if (leaveCount === 0) {
                text += quote(`📊 Tidak ada grup dengan anggota ≤ 2`);
            } else {
                text += quote(`📊 Total grup yang ditinggalkan: ${leaveCount}`);
            }
            
            text += "\n\n" + config.msg.footer;
            
            return await ctx.reply(text);
        } catch (error) {
            return await tools.cmd.handleError(ctx, error, false);
        }
    }
};
