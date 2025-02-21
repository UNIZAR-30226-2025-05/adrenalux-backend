export const METRICAS_JUGADORES = {
    delanteros: {
      ataque: {
        goals: 1.5,
        assists_intentional: 1,
        shots_on_target_inc_goals: 1,
        headed_goals: 1,
        penalty_goals: 1,
        successful_dribbles: 0.8,
        key_passes_attempt_assists: 0.7,
        winning_goal: 1.2,
        successful_crosses_open_play: 0.6,
        hit_woodwork: 0.4,
      },
      medio: {
        open_play_passes: 0.8,
        successful_passes_opposition_half: 1,
        successful_short_passes: 0.7,
      },
      defensa: {
        recoveries: 0.5,
        duels_won: 0.4,
      },
    },
    mediocampistas: {
      ataque: {
        goal_assists: 1,
        goals_from_outside_box: 0.8,
        through_balls: 1.2,
        key_passes_attempt_assists: 1,
        successful_long_passes: 0.8,
      },
      medio: {
        successful_open_play_passes: 1.2,
        successful_passes_opposition_half: 1,
        successful_passes_own_half: 1,
        total_tackles: 0.7,
        recoveries: 1.2,
        duels_won: 0.8,
      },
      defensa: {
        interceptions: 1,
        total_clearances: 0.6,
        tackles_won: 0.8,
        fifty_fifty: 0.5,
      },
    },
    defensas: {
      ataque: {
        headed_goals: 0.6,
        goal_assists: 0.5,
        successful_long_passes: 0.7,
      },
      medio: {
        recoveries: 1.2,
        duels_won: 1,
        interceptions: 1,
        successful_passes_own_half: 0.9,
        total_tackles: 0.8,
      },
      defensa: {
        clearances_off_the_line: 1.5,
        tackles_won: 1.3,
        blocks: 1.2,
        aerial_duels_won: 1.2,
        duels_won: 1,
        fifty_fifty: 0.7,
      },
    },
    porteros: {
      ataque: {
        goal_assists: 0.4,
        successful_long_passes: 0.7,
      },
      medio: {
        successful_passes_own_half: 1,
        gk_successful_distribution: 1,
      },
      defensa: {
        saves_made: 1.5,
        saves_made_caught: 1,
        saves_from_penalty: 1.2,
        clean_sheets: 1.3,
        goals_conceded: -1.5,
        goals_conceded_inside_box: -1.3,
        goals_conceded_outside_box: -1.2,
      },
    },
  };