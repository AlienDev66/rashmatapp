-- Replace dead Google sample bucket URLs (HTTP 403) with working public H.264 MP4s.

update public.exercises
set video_url = case (abs(hashtext(id)) % 6)
  when 0 then 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  when 1 then 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4'
  when 2 then 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4'
  when 3 then 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4'
  when 4 then 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4'
  else 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4'
end
where video_url is null
   or video_url = ''
   or video_url like '%gtv-videos-bucket%';

update public.workout_sessions
set video_url = case (abs(hashtext(id)) % 6)
  when 0 then 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
  when 1 then 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4'
  when 2 then 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4'
  when 3 then 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4'
  when 4 then 'https://filesamples.com/samples/video/mp4/sample_640x360.mp4'
  else 'https://www.learningcontainer.com/wp-content/uploads/2020/05/sample-mp4-file.mp4'
end
where video_url is null
   or video_url = ''
   or video_url like '%gtv-videos-bucket%';

-- Passing Pressure drills the user is testing
update public.exercises set
  video_url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  mux_playback_id = null
where id = 'e5';

update public.exercises set
  video_url = 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4',
  mux_playback_id = null
where id = 'e6';

update public.exercises set
  video_url = 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/360/Big_Buck_Bunny_360_10s_1MB.mp4',
  mux_playback_id = null
where id = 'e7';

update public.exercises set
  video_url = 'https://samplelib.com/lib/preview/mp4/sample-5s.mp4',
  mux_playback_id = null
where id = 'e16';

update public.workout_sessions set
  video_url = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
  mux_playback_id = null
where id = 'day-2-guard';
