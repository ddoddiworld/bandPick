INSERT OR IGNORE INTO members (id, display_name, normalized_name, position, pin_hash, role, is_active)
VALUES
  (1, 'Emily', 'emily', 'GUITAR', 'pbkdf2_sha256$210000$gUHxMeeCVa35woXPnxA7og==$dUZR24LuhdumdlgpHwfp6uiYzvpFFYzcu9/OSr006l4=', 'OWNER', 1),
  (2, 'Jin', 'jin', 'VOCAL', 'pbkdf2_sha256$210000$EMzU6fzABpRXqSkp3IhPDg==$luYSkRNQNTirYLIVjCvv0rWv1uWuCiOY8Yy6gQUgXDs=', 'ADMIN', 1),
  (3, 'Mina', 'mina', 'KEYBOARD', 'pbkdf2_sha256$210000$mdHzAEw9rQoH8wo0g+M8Kw==$bQlruebC9h5fmVrrXtPMI0O8pXf/gpKysoF7GpnXI9I=', 'MEMBER', 1),
  (4, 'Noah', 'noah', 'BASS', 'pbkdf2_sha256$210000$Qjq0/gvQkdoeKERw3lTL6Q==$P/ocE/VUaD9Ir5CplRagCah94pcLPYzwbSV1mnK6Jes=', 'MEMBER', 1),
  (5, 'Sora', 'sora', 'DRUMS', 'pbkdf2_sha256$210000$t4yhNo8Kcpt1rIE+1U303A==$jUWuDkbzpHxfZIQTnL3NSzcFPs087rKpaRgfl+5jZTo=', 'MEMBER', 1),
  (6, 'Jun', 'jun', 'GUITAR', 'pbkdf2_sha256$210000$Ipgopx3GxiLjPNnkxw9vbw==$Obc6F62+7v8d2neCWeRKkdIf5HGdwNMI2QwEi2WMazM=', 'MEMBER', 1),
  (7, 'Hana', 'hana', 'VOCAL', 'pbkdf2_sha256$210000$oyu9aSUJult0M2omUr14Fw==$hJMoCWYbNMv1jBKfliChV5Q0baWi5yn1iWbaBRdjwa8=', 'MEMBER', 1);

INSERT OR IGNORE INTO monthly_rounds (
  id, year, month, revision, status, nomination_deadline, voting_deadline, hero_title, hero_description
)
VALUES (
  1, 2026, 8, 1, 'nominating',
  unixepoch('2026-08-21 13:00:00') * 1000,
  unixepoch('2026-08-28 13:00:00') * 1000,
  '피자 한 판 고르듯,
이번 달 합주곡을 골라요.',
  '피자집브레이크타임 멤버들이 한 조각씩 의견을 더해요. 전원이 좋아요를 누르면 이번 달 셋리스트 후보가 됩니다.'
);

INSERT OR IGNORE INTO round_members (round_id, member_id)
SELECT 1, id FROM members WHERE id BETWEEN 1 AND 7;

INSERT OR IGNORE INTO songs (id, round_id, artist, title, song_type, url, note, created_by_member_id)
VALUES
  (1, 1, 'Oasis', 'Don''t Look Back in Anger', 'MALE', 'https://www.youtube.com/results?search_query=Oasis+Don%27t+Look+Back+in+Anger', '다 같이 후렴을 부르면 공연 마지막 곡으로 좋을 것 같아요.', 1),
  (2, 1, 'Silica Gel', 'NO PAIN', 'MALE', 'https://www.youtube.com/results?search_query=Silica+Gel+NO+PAIN', '신스와 기타 톤을 맞춰보는 재미가 있을 것 같아요.', 3),
  (3, 1, 'DAY6', '한 페이지가 될 수 있게', 'FEMALE', 'https://www.youtube.com/results?search_query=DAY6+한+페이지가+될+수+있게', '각 파트가 고르게 돋보이고 합주 에너지가 좋아요.', 2);

INSERT OR IGNORE INTO votes (song_id, member_id, value)
VALUES
  (1, 2, 'like'), (1, 3, 'like'), (1, 4, 'like'), (1, 5, 'like'),
  (2, 1, 'like'), (2, 2, 'like'), (2, 4, 'like'), (2, 5, 'like'), (2, 6, 'like'),
  (3, 1, 'like'), (3, 2, 'like'), (3, 3, 'like'), (3, 4, 'dislike');
