import { supabase } from './supabase.ts';

interface Player {
    id: string;
    pseudo: string;
}

export const generateBracket = async (tournamentId: number, participants: Player[]) => {
    const shuffledPlayers = [...participants].sort(() => 0.5 - Math.random());
    const count = shuffledPlayers.length;

    let size = 2;
    while (size < count) {
        size *= 2;
    }

    const finalList: (Player | null)[] = [...shuffledPlayers];
    while (finalList.length < size) {
        finalList.push(null);
    }

    const matches = [];
    const totalRounds = Math.log2(size);
    const half = size / 2;

    for (let i = 0; i < half; i++) {
        const player1 = finalList[i];
        const player2 = finalList[size - 1 - i];

        let winnerId = null;
        let score1 = 0;
        let score2 = 0;

        if (!player2 && player1) {
            winnerId = player1.id;
            score1 = 1;
        } else if (!player1 && player2) {
            winnerId = player2.id;
            score2 = 1;
        }

        matches.push({
            tournament_id: tournamentId,
            round_number: 1,
            match_number: i + 1,
            player1_id: player1 ? player1.id : null,
            player2_id: player2 ? player2.id : null,
            winner_id: winnerId,
            score_p1: score1,
            score_p2: score2,
            side: 'winners'
        });
    }

    for (let r = 2; r <= totalRounds; r++) {
        const matchesInThisRound = size / Math.pow(2, r);
        for (let m = 0; m < matchesInThisRound; m++) {
            matches.push({
                tournament_id: tournamentId,
                round_number: r,
                match_number: m + 1,
                player1_id: null,
                player2_id: null,
                winner_id: null,
                score_p1: 0,
                score_p2: 0,
                side: 'winners'
            });
        }
    }

    const { error } = await supabase.from('matches').insert(matches);
    if (error) throw error;

    await supabase
        .from('tournaments')
        .update({ status: 'started' })
        .eq('id', tournamentId);

    return true;
};