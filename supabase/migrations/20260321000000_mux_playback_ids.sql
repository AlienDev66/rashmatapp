-- Attach your Mux Playback ID to seeded workout content.
-- Playback IDs are public (used in HLS URLs); safe to store in DB.

update public.workout_sessions
set mux_playback_id = '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA'
where id = 'day-1-guard'
  and (mux_playback_id is null or mux_playback_id = '');

update public.exercises
set mux_playback_id = '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA'
where session_id = 'day-1-guard'
  and (mux_playback_id is null or mux_playback_id = '');
