export type TournamentStatus = 'open' | 'started' | 'completed';
export type BracketType = 'single_elimination' | 'double_elimination';
export type MatchFormat = 'bo1' | 'bo3' | 'bo5';
export type BracketSide = 'winners' | 'losers' | 'final';

export interface Item {
    id: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    slots: number | null;
    deleted_at: string | null;
    category: string | null;
}

export interface CartItem {
    id: number;
    user_id: string;
    item_id: string;
    quantity: number;
    items?: Item;
}

export interface Profile {
    id: string;
    minecraft_pseudo: string | null;
    twitch_id: string | null;
    is_sub: boolean;
}

export interface WikiArticle {
    id: number | string;
    title: string;
    description: string;
    category: string;
    video_url: string | null;
    image_urls: string[] | null;
    created_at: string;
}

export interface Tournament {
    id: number;
    title: string;
    description: string;
    start_date: string;
    status: TournamentStatus;
    bracket_type: BracketType;
    match_format: MatchFormat;
    max_players: number;
    winner_id?: string;
}

export interface Participant {
    id: number;
    user_id: string;
    profiles: {
        minecraft_pseudo: string;
        avatar_url: string;
    };
}

export interface Match {
    id: number;
    round_number: number;
    match_number: number;
    side: BracketSide;
    player1_id?: string;
    player2_id?: string;
    player1?: { minecraft_pseudo: string };
    player2?: { minecraft_pseudo: string };
    score_p1: number;
    score_p2: number;
    winner_id?: string;
    next_match_id?: number;
}