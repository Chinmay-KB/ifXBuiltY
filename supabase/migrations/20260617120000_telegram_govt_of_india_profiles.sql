-- Enriched company profiles for Telegram and Government of India.
-- Seeds style_dna + archetype so mergeCompanyPair() can inject cultural meme
-- triggers, UX anti-patterns, and archetype targets into generation prompts.

insert into public.company_profiles (
  id,
  name,
  profile_type,
  parent_company_id,
  category,
  popularity_tier,
  research_status,
  meme_strength,
  style_dna,
  archetype,
  default_vibe_tags,
  source_urls,
  logo_path
)
values
  (
    'telegram',
    'Telegram',
    'company',
    null,
    'messaging',
    1,
    'approved',
    4,
    jsonb_build_object(
      'tone', jsonb_build_array('fast', 'privacy-branded', 'channel-driven', 'bot-heavy'),
      'colors', jsonb_build_array(
        '#2AABEE Telegram blue',
        'white chat bubbles',
        'dark charcoal backgrounds',
        'green online indicators'
      ),
      'visual_traits', jsonb_build_array(
        'rounded chat bubbles',
        'channel feed with megaphone icon',
        'sticker panel drawer',
        'circular avatars',
        'reply/forward quote bars'
      ),
      'ux_traits', jsonb_build_array(
        'channels with unlimited subscribers',
        'secret chats with self-destruct timers',
        'bots for every workflow',
        'forwarded-message chains',
        'cloud sync across devices',
        'voice message hold-to-record'
      ),
      'meme_exaggeration', jsonb_build_array(
        '''encrypted'' group chats with 50,000 members',
        'crypto pump signal channels',
        'forwarding the same meme through 12 groups',
        'admin-only channels that are just ads',
        'founder-as-meme energy in every update'
      ),
      'iconic_elements', jsonb_build_array(
        'paper plane logo',
        'blue circle app icon',
        'channel megaphone badge',
        'sticker/GIF tab',
        'double-check read receipts'
      ),
      'behavioral_stereotypes', jsonb_build_array(
        'moving every group chat off WhatsApp',
        'using Telegram as a cloud drive',
        'joining random channels at 2am',
        'trusting bots with your OTP'
      ),
      'satirical_patterns', jsonb_build_array(
        'This message was deleted (in a channel where nothing is ever deleted)',
        'Bot responded in 0.3s — humans still typing...',
        'Channel: ''Official Updates'' (last post: crypto scam)'
      )
    ),
    jsonb_build_object(
      'type', 'messaging with channels, groups, and bot integrations',
      'sections', jsonb_build_array(
        'chat list',
        'conversation thread',
        'channel broadcast feed',
        'sticker/GIF picker',
        'bot command inline keyboard',
        'voice message recorder'
      ),
      'layout', 'mobile app',
      'content_style', jsonb_build_array(
        'text messages',
        'stickers',
        'voice notes',
        'forwarded quotes',
        'channel posts',
        'polls',
        'file attachments'
      )
    ),
    ARRAY['Chaotic']::text[],
    '["https://telegram.org"]'::jsonb,
    null
  ),
  (
    'govt-of-india',
    'Government of India',
    'company',
    null,
    'government',
    1,
    'approved',
    5,
    jsonb_build_object(
      'tone', jsonb_build_array('bureaucratic', 'form-heavy', 'multi-language', 'official-but-chaotic'),
      'colors', jsonb_build_array(
        'saffron/white/green tricolor accents',
        'navy government headers',
        'beige form backgrounds',
        'red mandatory-field asterisks'
      ),
      'visual_traits', jsonb_build_array(
        'dense multi-column forms',
        'tricolor stripe banners',
        'Ashoka Chakra emblem placement',
        'captcha boxes',
        'PDF download buttons',
        '.gov.in domain chrome'
      ),
      'ux_traits', jsonb_build_array(
        'Aadhaar OTP verification',
        'mandatory document upload',
        'multi-step wizard with no save progress',
        'Digilocker integration prompts',
        '22-language selector',
        'office-hours disclaimers',
        'reference number generators'
      ),
      'meme_exaggeration', jsonb_build_array(
        'Aadhaar OTP never arrives',
        'please visit office in person for online service',
        'form 27B in triplicate',
        'website crashes on launch day',
        'captcha that even humans cannot read',
        'application under review for 18 months'
      ),
      'iconic_elements', jsonb_build_array(
        'Ashoka Chakra',
        'tricolor header stripe',
        'Government of India masthead',
        'Digilocker badge',
        'PAN/Aadhaar field pairs',
        'helpline number buried in footer'
      ),
      'behavioral_stereotypes', jsonb_build_array(
        'needing 15 documents to change one letter in your name',
        'office counters open 10am–1pm only',
        'printing forms to submit to a portal',
        'WhatsApp forwards treated as official notice'
      ),
      'satirical_patterns', jsonb_build_array(
        'Please enable JavaScript, Flash Player, and a valid reason for living',
        'Translating this page into 22 official languages simultaneously',
        'Mandatory Aadhaar verification to order pizza',
        'Your request has been received. Expected resolution: undefined'
      )
    ),
    jsonb_build_object(
      'type', 'citizen services portal with compliance-heavy workflows',
      'sections', jsonb_build_array(
        'login with Aadhaar/mobile OTP',
        'multi-page application form',
        'document upload checklist',
        'fee payment gateway',
        'application status tracker',
        'grievance/helpline footer'
      ),
      'layout', 'desktop web',
      'content_style', jsonb_build_array(
        'form fields with asterisks',
        'declaration checkboxes',
        'reference numbers',
        'bilingual labels',
        'PDF notices',
        'queue position text'
      )
    ),
    ARRAY['Bureaucratic', 'Chaotic']::text[],
    '["https://www.india.gov.in"]'::jsonb,
    null
  )
on conflict (id) do update set
  name = excluded.name,
  profile_type = excluded.profile_type,
  parent_company_id = excluded.parent_company_id,
  category = excluded.category,
  popularity_tier = excluded.popularity_tier,
  research_status = excluded.research_status,
  meme_strength = excluded.meme_strength,
  style_dna = excluded.style_dna,
  archetype = excluded.archetype,
  default_vibe_tags = excluded.default_vibe_tags,
  source_urls = excluded.source_urls;
