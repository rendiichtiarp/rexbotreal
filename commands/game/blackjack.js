const { monospace, quote } = require("@mengkodingan/ckptw");
const Database = require("../../lib/database/queries");

// prevent multiple games in same chat
const sessions = new Map();

// create a standard 52-card deck
function createDeck() {
  const suits = ['♠', '♥', '♣', '♦'];
  const ranks = [
    { name: 'A', value: 11 },
    { name: '2', value: 2 },
    { name: '3', value: 3 },
    { name: '4', value: 4 },
    { name: '5', value: 5 },
    { name: '6', value: 6 },
    { name: '7', value: 7 },
    { name: '8', value: 8 },
    { name: '9', value: 9 },
    { name: '10', value: 10 },
    { name: 'J', value: 10 },
    { name: 'Q', value: 10 },
    { name: 'K', value: 10 }
  ];
  const deck = [];
  for (let suit of suits) for (let r of ranks) deck.push({ name: `${r.name}${suit}`, value: r.value });
  return deck;
}

// Fisher–Yates shuffle
function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// calculate best hand score (Aces as 1 or 11)
function calcScore(hand) {
  let total = hand.reduce((sum, c) => sum + c.value, 0);
  let aces = hand.filter(c => c.name.startsWith('A')).length;
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return total;
}

module.exports = {
  name: "blackjack",
  category: "game",
  aliases: ["bj"],
  permissions: {},
  code: async (ctx) => {
    const chatId = ctx.id;
    if (sessions.has(chatId)) {
      return ctx.reply(quote(`🎮 Sesi permainan sedang berlangsung!`));
    }
    sessions.set(chatId, true);

    try {
      // parse bet
      const betArg = ctx.args[0];
      const bet = parseInt(betArg, 10);
      if (!betArg || isNaN(bet) || bet < 10) {
        sessions.delete(chatId);
        return ctx.reply(
          `${quote(`Penggunaan: ${monospace(ctx.used.prefix + ctx.used.command)} <taruhan (>=10)>`)}\n` +
          `${quote(`Contoh: ${monospace(ctx.used.prefix + ctx.used.command)} 100`)}\n` +
          "\n" +
          config.msg.footer
        );
      }

      // check balance
      const playerJid = ctx.sender.jid;
      const playerId = tools.general.getID(playerJid);
      const userDb = await Database.getUser(playerId);
      const coins = userDb?.coin || 0;
      
      if (coins < bet) {
        sessions.delete(chatId);
        return ctx.reply(quote("❎ Anda tidak memiliki cukup koin untuk bertaruh!"));
      }
      
      // deduct bet up front
      await Database.updateUser(playerId, {
        coin: coins - bet
      });

      // prepare deck & hands
      const deck = createDeck(); 
      shuffle(deck);
      const player = [deck.pop(), deck.pop()];
      const dealer = [deck.pop(), deck.pop()];

      // initial reveal: show one dealer card and show total
      const dealerScore = calcScore(dealer);
      await ctx.reply(
        `${quote("🎮 Blackjack Game Started!")}\n` +
        `${quote(`💰 Taruhan: ${monospace(bet + " koin")}`)}\n` +
        `${quote(`🎭 Dealer: ${monospace(dealer[0].name)} ❓`)}\n` +
        `${quote(`🎲 Kartu Anda: ${monospace(player.map(c=>c.name).join(' '))} (Total: ${calcScore(player)})`)}\n` +
        `${quote(`Ketik ${monospace("hit")} untuk ambil kartu atau ${monospace("stand")} untuk berhenti.`)}\n` +
        `${quote(`⏱️ Waktu: ${monospace("60 detik")}`)}\n` +
        "\n" +
        config.msg.footer
      );

      // collector for actions (only from player)
      const collector = ctx.MessageCollector({ time: 60000 });
      collector.on('collect', async m => {
        // ignore others
        if (m.sender !== playerJid) return;
        const cmd = m.content.toLowerCase();
        if (!['hit','stand'].includes(cmd)) return;

        // HIT action
        if (cmd === 'hit') {
          player.push(deck.pop());
          const playerScoreNew = calcScore(player);
          if (playerScoreNew > 21) {
            // bust: reveal both totals and end
            const text =
              `${quote("💥 BUST! Anda kalah!")}\n` +
              `${quote(`🎭 Dealer: ${monospace(dealer.map(c=>c.name).join(' '))} (Total: ${dealerScore})`)}\n` +
              `${quote(`🎲 Kartu Anda: ${monospace(player.map(c=>c.name).join(' '))} (Total: ${playerScoreNew})`)}\n` +
              `${quote(`💸 Anda kehilangan ${monospace(bet + " koin")}!`)}\n` +
              "\n" +
              config.msg.footer;
            sessions.delete(chatId);
            await ctx.sendMessage(chatId, { text }, { quoted: m });
            return collector.stop();
          }
          // still in game: show new card
          await ctx.sendMessage(chatId, {
            text:
              `${quote(`🎭 Dealer: ${monospace(dealer[0].name)} ❓`)}\n` +
              `${quote(`🎲 Kartu Anda: ${monospace(player.map(c=>c.name).join(' '))} (Total: ${playerScoreNew})`)}\n` +
              `${quote(`Ketik ${monospace("hit")} untuk ambil kartu atau ${monospace("stand")} untuk berhenti.`)}\n` +
              "\n" +
              config.msg.footer
          }, { quoted: m });

        } else {
          // STAND: only called by player
          // dealer draws until >=17
          let dealerScoreFinal = calcScore(dealer);
          while (dealerScoreFinal < 17) {
            dealer.push(deck.pop());
            dealerScoreFinal = calcScore(dealer);
          }
          const playerScoreFinal = calcScore(player);
          let resultMsg, resultEmoji;
          
          // Update database based on result
          if (dealerScoreFinal > 21 || playerScoreFinal > dealerScoreFinal) {
            // Win: return bet * 2 and increment win counter
            await Database.updateUser(playerId, {
              coin: (userDb?.coin || 0) + (bet * 2),
              win_game: (userDb?.win_game || 0) + 1
            });
            resultMsg = "Anda menang!";
            resultEmoji = "🎉";
          } else if (playerScoreFinal === dealerScoreFinal) {
            // Draw: return bet
            await Database.updateUser(playerId, {
              coin: (userDb?.coin || 0) + bet
            });
            resultMsg = "Seri!";
            resultEmoji = "🤝";
          } else {
            // Loss: bet already deducted
            resultMsg = "Anda kalah!";
            resultEmoji = "💔";
          }

          // final summary
          const summary =
            `${quote(`${resultEmoji} ${resultMsg}`)}\n` +
            `${quote(`🎭 Dealer: ${monospace(dealer.map(c=>c.name).join(' '))} (Total: ${dealerScoreFinal})`)}\n` +
            `${quote(`🎲 Kartu Anda: ${monospace(player.map(c=>c.name).join(' '))} (Total: ${playerScoreFinal})`)}\n` +
            `${quote(`💰 ${resultMsg.includes('menang') ? 
              `Anda mendapat ${monospace(bet + " koin")}!` : 
              resultMsg.includes('Seri') ? 
              `Taruhan ${monospace(bet + " koin")} dikembalikan!` : 
              `Anda kehilangan ${monospace(bet + " koin")}!`}`)}\n` +
            "\n" +
            config.msg.footer;
            
          sessions.delete(chatId);
          await ctx.sendMessage(chatId, { text: summary }, { quoted: m });
          return collector.stop();
        }
      });

      collector.on('end', () => { 
        if (sessions.has(chatId)) {
          sessions.delete(chatId);
          return ctx.reply(
            `${quote("⏱️ Waktu habis!")}\n` +
            `${quote("Permainan dibatalkan.")}\n` +
            `${quote(`💰 Taruhan ${monospace(bet + " koin")} dikembalikan!`)}\n` +
            "\n" +
            config.msg.footer
          );
        }
      });

    } catch (e) {
      sessions.delete(chatId);
      console.error(e);
      return tools.cmd.handleError(ctx, e, false);
    }
  }
};