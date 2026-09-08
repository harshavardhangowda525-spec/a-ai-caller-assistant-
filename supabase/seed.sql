-- Seed content mirroring src/lib/seed-data.ts. Safe to re-run (upserts).

insert into public.menu_items (id, name, description, price, category, image, available, featured, sort) values
  ('vietnamese-coffee','Vietnamese Coffee','Dark, slow-dripped and finished with silky condensed milk.',260,'signature','/images/coffee-vietnamese.jpg',true,true,1),
  ('malnad-magic','Malnad Magic','Our house pour — single-origin Malnad beans, bright and full-bodied.',240,'signature','/images/coffee-malnad.jpg',true,true,2),
  ('cold-brew','Cold Brew','Steeped 18 hours for a smooth, low-acidity, naturally sweet cup.',280,'cold','/images/coffee-coldbrew.jpg',true,true,3),
  ('pour-over','Pour Over Coffee','A clean, delicate hand-brew that lets the origin speak for itself.',300,'signature','/images/coffee-pourover.jpg',true,true,4),
  ('sakkat-latte','Sakkat Latte','Our signature spiced latte — warm, local and impossibly comforting.',290,'signature','/images/coffee-sakkat.jpg',true,true,5),
  ('salted-pistachio-latte','Salted Pistachio Latte','Roasted pistachio, a whisper of salt, and espresso in balance.',320,'signature','/images/coffee-pistachio.jpg',true,true,6),
  ('iced-latte','Iced Latte','Double shot over ice with cold milk — crisp and effortless.',250,'cold','/images/coffee-icedlatte.jpg',true,true,7),
  ('hot-vanilla-latte','Hot Vanilla Latte','Real vanilla folded into steamed milk and a smooth espresso base.',270,'coffee','/images/coffee-vanilla.jpg',true,true,8),
  ('korean-cream-cheese-bun','Korean Cream Cheese Bun','Pillowy, golden bun with a rich, tangy cream-cheese heart.',220,'food','/images/food-creamcheese-bun.jpg',true,true,9),
  ('biscoff-bliss-brownie','Biscoff Bliss Brownie','Fudgy dark-chocolate brownie swirled with molten Biscoff.',240,'dessert','/images/food-biscoff-brownie.jpg',true,true,10)
on conflict (id) do update set
  name=excluded.name, description=excluded.description, price=excluded.price,
  category=excluded.category, image=excluded.image, available=excluded.available,
  featured=excluded.featured, sort=excluded.sort;

insert into public.events (id, title, date, time, description, image, booking_url, published) values
  ('live-music-fri','Live Music Fridays','2026-09-11','8:00 PM','Acoustic sets from Bengaluru artists under warm light. Order a Sakkat Latte and stay a while.','/images/event-livemusic.jpg',null,true),
  ('karaoke-night','Karaoke Nights','2026-09-13','9:00 PM','Grab the mic. Our after-dark karaoke turns the café into the friendliest stage on Church Street.','/images/event-karaoke.jpg',null,true),
  ('community-cupping','Community Cupping','2026-09-18','5:00 PM','A guided tasting through our tribal-origin lots. Meet the roasters, learn to taste like a pro.','/images/event-cupping.jpg',null,true),
  ('seasonal-launch','Seasonal Menu Launch','2026-09-25','6:00 PM','First taste of our new seasonal specials, from spiced cold brews to festive bakes.','/images/event-seasonal.jpg',null,true)
on conflict (id) do update set
  title=excluded.title, date=excluded.date, time=excluded.time,
  description=excluded.description, image=excluded.image,
  booking_url=excluded.booking_url, published=excluded.published;

insert into public.gallery (id, src, caption, category, span, sort) values
  ('g1','/images/gallery-pour.jpg','The perfect pour','coffee','tall',1),
  ('g2','/images/gallery-interior.jpg','Our Church Street corner','interior','wide',2),
  ('g3','/images/food-creamcheese-bun.jpg','Korean cream cheese bun','food','normal',3),
  ('g4','/images/event-livemusic.jpg','Live music after dark','events','normal',4),
  ('g5','/images/gallery-latteart.jpg','Latte art in progress','coffee','normal',5),
  ('g6','/images/gallery-vibe.jpg','The evening vibe','vibe','tall',6),
  ('g7','/images/food-biscoff-brownie.jpg','Biscoff bliss brownie','food','normal',7),
  ('g8','/images/gallery-beans.jpg','Single-origin beans','coffee','wide',8),
  ('g9','/images/gallery-counter.jpg','At the counter','interior','normal',9)
on conflict (id) do update set
  src=excluded.src, caption=excluded.caption, category=excluded.category,
  span=excluded.span, sort=excluded.sort;

insert into public.site_content (key, value) values
  ('heroHeadline','Coffee with a story.'),
  ('heroSub','Specialty coffee sourced from tribal farms, crafted with passion in the heart of Church Street.'),
  ('heroBadge','Church Street · Bengaluru'),
  ('aboutTitle','Rooted in origin. Brewed for today.'),
  ('openingHours','Open daily · 8:00 AM – 11:00 PM'),
  ('phone','+918041234567'),
  ('address','16/4, Church St, Haridevpur, Shanthala Nagar, Ashok Nagar, Bengaluru, Karnataka 560001'),
  ('email','hello@tribalbrew.coffee'),
  ('instagram','https://instagram.com/tribalbrewdaily'),
  ('facebook','https://facebook.com/tribalbrewdaily'),
  ('orderingUrl','https://tribalbrew.coffee/order')
on conflict (key) do update set value=excluded.value;
