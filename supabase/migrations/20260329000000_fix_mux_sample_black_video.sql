-- Replace broken Mux sample HLS (audio-only / black video on iOS) with public MP4s.
-- Sample id 7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA was seeded everywhere as a placeholder.

update public.exercises
set
  video_url = coalesce(
    nullif(video_url, ''),
    case (abs(hashtext(id)) % 8)
      when 0 then 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
      when 1 then 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4'
      when 2 then 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4'
      when 3 then 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4'
      when 4 then 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4'
      when 5 then 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
      when 6 then 'https://storage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4'
      else 'https://storage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4'
    end
  ),
  mux_playback_id = null
where mux_playback_id = '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA'
   or (video_url is null and mux_playback_id is not null and mux_playback_id <> '');

update public.workout_sessions
set
  video_url = coalesce(
    nullif(video_url, ''),
    'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4'
  ),
  mux_playback_id = case
    when mux_playback_id = '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA' then null
    else mux_playback_id
  end
where mux_playback_id = '7qmxaMdclISiRxo1LMN9JW22fxgD101hKcitnAGEl1ZA'
   or video_url is null;

-- Explicit day-2-guard drills the user is testing
update public.exercises set
  video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
  mux_playback_id = null
where id = 'e5';

update public.exercises set
  video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
  mux_playback_id = null
where id = 'e6';

update public.exercises set
  video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4',
  mux_playback_id = null
where id = 'e7';

update public.exercises set
  video_url = 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
  mux_playback_id = null
where id = 'e16';
