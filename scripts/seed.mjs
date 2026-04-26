/**
 * SisterRoam — Dummy Data Seed Script
 *
 * Creates:
 *   - 10 host users   (role: 'host')
 *   - 20 guest users  (role: 'guest')
 *   - 20 both users   (role: 'both')
 *   - 30 HostProfiles (for all host + both users)
 *   - 10 HostingRequests with messages (chats)
 *   - 6  BlogPosts
 *   - 12 CommunityPosts with comments
 *
 * Run:  node scripts/seed.mjs
 * Clean: node scripts/seed.mjs --clean
 */

import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLEAN = process.argv.includes('--clean')
const SEED_DOMAIN = '@sisterroam-seed.dev'

// ── Load .env.local ───────────────────────────────────────────────────────────
const envRaw = readFileSync(join(__dirname, '../.env.local'), 'utf8')
const env = Object.fromEntries(
  envRaw
    .split('\n')
    .filter(l => l.trim() && !l.trim().startsWith('#') && l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim()] })
)
const MONGODB_URI = env.MONGODB_URI
if (!MONGODB_URI) throw new Error('MONGODB_URI not found in .env.local')

// ── Helpers ───────────────────────────────────────────────────────────────────
const oid = () => new mongoose.Types.ObjectId()
function slugify(t) { return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
function rand(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function randN(arr, n) { return [...arr].sort(() => 0.5 - Math.random()).slice(0, n) }
function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d }
function daysFromNow(n) { const d = new Date(); d.setDate(d.getDate() + n); return d }

// ── Inline Schemas (no app hooks — we handle hashing/slugs manually) ──────────
const { Schema, model, models } = mongoose

const userSchema = new Schema({
  _id: Schema.Types.ObjectId,
  email: String, password: String, fullName: String, username: String,
  age: Number, gender: { type: String, default: 'female' },
  city: String, country: String, countryCode: String,
  languages: [String], education: String, occupation: String, bio: String,
  profilePhotoUrl: String, travellerCategories: [String],
  countriesVisited: [String], hobbies: [String],
  verificationTier: { type: String, default: 'basic' },
  role: { type: String, default: 'guest' },
  isAdmin: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  onboardingCompleted: { type: Boolean, default: true },
  onboardingStep: { type: Number, default: 5 },
  emailVerified: { type: Boolean, default: true },
  totalStays: { type: Number, default: 0 },
  totalHostings: { type: Number, default: 0 },
  averageRating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  emergencyContactName: String, emergencyContactPhone: String,
  emergencyContactRelationship: String,
  emailNotifications: {
    newRequest: { type: Boolean, default: true },
    requestAccepted: { type: Boolean, default: true },
    requestDeclined: { type: Boolean, default: true },
    newMessage: { type: Boolean, default: true },
    checkinReminder: { type: Boolean, default: true },
    reviewReceived: { type: Boolean, default: true },
    verificationUpdate: { type: Boolean, default: true },
  },
}, { timestamps: true })

const hostProfileSchema = new Schema({
  _id: Schema.Types.ObjectId,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  accommodationType: String, maxGuests: Number,
  freeOfferings: [String], houseRules: String,
  languagesForGuests: [String], femaleOnly: Boolean,
  isAcceptingGuests: { type: Boolean, default: true },
  isListingActive: { type: Boolean, default: true },
  responseRate: Number, responseTimeHours: Number, totalStays: Number,
  paidServices: [{ name: String, description: String, price: Number, currency: String, duration: String }],
  addressLine: String, addressCity: String, addressCountry: String,
  addressVerified: { type: Boolean, default: false },
}, { timestamps: true })

const hostingRequestSchema = new Schema({
  _id: Schema.Types.ObjectId,
  guestId: { type: Schema.Types.ObjectId, ref: 'User' },
  hostId: { type: Schema.Types.ObjectId, ref: 'User' },
  checkInDate: Date, checkOutDate: Date, nights: Number,
  message: String, status: String,
  safetyAcknowledged: { type: Boolean, default: true },
  lastMessageAt: Date, lastMessagePreview: String,
}, { timestamps: true })

const messageSchema = new Schema({
  _id: Schema.Types.ObjectId,
  requestId: { type: Schema.Types.ObjectId, ref: 'HostingRequest' },
  senderId: { type: Schema.Types.ObjectId, ref: 'User' },
  content: String, isRead: Boolean, readAt: Date,
  messageType: { type: String, default: 'text' },
  createdAt: { type: Date, default: Date.now },
})

const blogPostSchema = new Schema({
  _id: Schema.Types.ObjectId,
  authorId: { type: Schema.Types.ObjectId, ref: 'User' },
  title: String, slug: String, excerpt: String, content: String,
  coverImageUrl: String, category: String, tags: [String],
  isPublished: { type: Boolean, default: true },
  viewsCount: Number, likesCount: Number, readTimeMinutes: Number,
  publishedAt: Date,
}, { timestamps: true })

const communityPostSchema = new Schema({
  _id: Schema.Types.ObjectId,
  authorId: { type: Schema.Types.ObjectId, ref: 'User' },
  content: String, category: String, imageUrls: [String],
  likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  likesCount: { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: true },
}, { timestamps: true })

const communityCommentSchema = new Schema({
  _id: Schema.Types.ObjectId,
  postId: { type: Schema.Types.ObjectId, ref: 'CommunityPost' },
  authorId: { type: Schema.Types.ObjectId, ref: 'User' },
  content: String,
}, { timestamps: true })

const User = models.User || model('User', userSchema)
const HostProfile = models.HostProfile || model('HostProfile', hostProfileSchema)
const HostingRequest = models.HostingRequest || model('HostingRequest', hostingRequestSchema)
const Message = models.Message || model('Message', messageSchema)
const BlogPost = models.BlogPost || model('BlogPost', blogPostSchema)
const CommunityPost = models.CommunityPost || model('CommunityPost', communityPostSchema)
const CommunityComment = models.CommunityComment || model('CommunityComment', communityCommentSchema)

// ── User Data ─────────────────────────────────────────────────────────────────

const PHOTO_BASE = 'https://randomuser.me/api/portraits/women'

const hostsRaw = [
  { fn: 'Priya Sharma',      un: 'priyasharma8801',     city: 'Mumbai',        country: 'India',        cc: 'IN', langs: ['English','Hindi','Marathi'],   tier: 'verified', occ: 'Graphic Designer',    edu: 'undergraduate',   cats: ['solo_traveller','trekker'],             visited: ['Nepal','Sri Lanka','Thailand','Japan','Germany'],    hobbies: ['Trekking','Photography','Yoga'],          bio: 'Mumbai-based trekker and solo traveller. I love sharing my home and showing guests the real side of India.',                                 age: 28, photo: 12 },
  { fn: 'Yuki Tanaka',       un: 'yukitanaka2204',      city: 'Tokyo',         country: 'Japan',        cc: 'JP', langs: ['Japanese','English'],          tier: 'verified', occ: 'Software Engineer',   edu: 'postgraduate',    cats: ['cyclist','solo_traveller'],             visited: ['South Korea','Taiwan','Thailand','Germany','France'], hobbies: ['Cycling','Cooking','Anime'],              bio: 'Tokyo cyclist and tech geek. My spare room is always ready for curious female travellers passing through Japan.',                           age: 31, photo: 15 },
  { fn: 'Ingrid Braun',      un: 'ingridbraun5503',     city: 'Berlin',        country: 'Germany',      cc: 'DE', langs: ['German','English','French'],   tier: 'trusted',  occ: 'Architect',           edu: 'postgraduate',    cats: ['cyclist','trekker','solo_traveller'],   visited: ['France','Italy','Spain','Netherlands','Denmark'],     hobbies: ['Architecture','Cycling','Reading'],       bio: 'Berlin architect with a big apartment and an even bigger love for meeting people from around the world.',                                    age: 34, photo: 20 },
  { fn: 'Sophie Martin',     un: 'sophiemartin3317',    city: 'Paris',         country: 'France',       cc: 'FR', langs: ['French','English','Spanish'],  tier: 'verified', occ: 'Art Curator',         edu: 'postgraduate',    cats: ['solo_traveller','road_tripper'],        visited: ['Spain','Italy','Morocco','Japan','Canada'],           hobbies: ['Art','Wine','Cooking'],                  bio: 'Parisian art curator. I host in my cosy Montmartre apartment and love connecting travellers with local culture.',                            age: 29, photo: 25 },
  { fn: 'Carmen Ruiz',       un: 'carmenruiz4421',      city: 'Barcelona',     country: 'Spain',        cc: 'ES', langs: ['Spanish','Catalan','English'], tier: 'verified', occ: 'Dance Instructor',    edu: 'undergraduate',   cats: ['runner','solo_traveller'],              visited: ['Portugal','France','Italy','Mexico','Colombia'],      hobbies: ['Flamenco','Running','Beach volleyball'], bio: 'Barcelona-based dancer and runner. Hosting solo women travellers is my favourite way to share the city I love.',                             age: 27, photo: 30 },
  { fn: 'Giulia Romano',     un: 'giuliaromano9906',    city: 'Rome',          country: 'Italy',        cc: 'IT', langs: ['Italian','English'],          tier: 'verified', occ: 'Food Blogger',        edu: 'undergraduate',   cats: ['solo_traveller','backpacker'],          visited: ['Greece','Spain','France','Croatia','Turkey'],         hobbies: ['Cooking','Food tours','History'],         bio: 'Rome food blogger. Stay with me and discover the real Roman cuisine and hidden neighbourhood gems.',                                         age: 32, photo: 35 },
  { fn: 'Emma Williams',     un: 'emmawilliams7714',    city: 'Sydney',        country: 'Australia',    cc: 'AU', langs: ['English'],                     tier: 'trusted',  occ: 'Marine Biologist',    edu: 'doctorate',       cats: ['trekker','solo_traveller','runner'],    visited: ['New Zealand','Indonesia','Japan','Portugal','USA'],   hobbies: ['Surfing','Trekking','Scuba diving'],      bio: 'Sydney marine biologist and adventurer. My home is a safe, welcoming base for women exploring Australia.',                                  age: 36, photo: 40 },
  { fn: 'Amina Osei',        un: 'aminaosei6628',       city: 'Nairobi',       country: 'Kenya',        cc: 'KE', langs: ['Swahili','English'],           tier: 'verified', occ: 'Safari Guide',        edu: 'undergraduate',   cats: ['trekker','solo_traveller'],             visited: ['Tanzania','Uganda','Rwanda','South Africa','Morocco'],hobbies: ['Wildlife photography','Hiking','Beading'], bio: 'Nairobi safari guide with a passion for connecting travellers with East African culture and wilderness.',                                    age: 30, photo: 45 },
  { fn: 'Fernanda Costa',    un: 'fernandacosta1109',   city: 'São Paulo',     country: 'Brazil',       cc: 'BR', langs: ['Portuguese','English','Spanish'],tier:'verified', occ: 'Journalist',          edu: 'undergraduate',   cats: ['solo_traveller','road_tripper'],        visited: ['Argentina','Peru','Colombia','Portugal','Spain'],     hobbies: ['Samba','Writing','Street art'],           bio: 'São Paulo journalist. My apartment is a creative hub for women exploring vibrant Brazil.',                                                   age: 33, photo: 50 },
  { fn: 'Nattaya Jaidee',    un: 'nattayajaidee3302',   city: 'Chiang Mai',    country: 'Thailand',     cc: 'TH', langs: ['Thai','English'],              tier: 'verified', occ: 'Yoga Instructor',     edu: 'undergraduate',   cats: ['solo_traveller','trekker'],             visited: ['Vietnam','Laos','Cambodia','Japan','India'],          hobbies: ['Yoga','Temple visits','Thai cooking'],   bio: 'Chiang Mai yoga instructor. Hosting women travellers in my peaceful home surrounded by mountains and temples.',                              age: 26, photo: 55 },
]

const guestsRaw = [
  { fn: 'Ashley Johnson',    un: 'ashleyjohnson4412',   city: 'New York',      country: 'United States',   cc: 'US', langs: ['English'],                     cats: ['solo_traveller','road_tripper'],        visited: ['France','Italy','Spain','Mexico'],             hobbies: ['Photography','Theatre','Yoga'],           bio: 'New York freelancer exploring Europe one city at a time.',                           age: 26, photo: 1  },
  { fn: 'Grace Bennett',     un: 'gracebennett7723',    city: 'London',        country: 'United Kingdom',  cc: 'GB', langs: ['English','French'],            cats: ['solo_traveller','backpacker'],          visited: ['Thailand','Indonesia','Vietnam','Japan'],     hobbies: ['Reading','Hiking','Journaling'],          bio: 'London teacher travelling Asia on my summer breaks.',                                age: 29, photo: 2  },
  { fn: 'Olivia Chen',       un: 'oliviachen5531',      city: 'Toronto',       country: 'Canada',          cc: 'CA', langs: ['English','Mandarin'],          cats: ['backpacker','solo_traveller'],          visited: ['Australia','Japan','South Korea','France'],   hobbies: ['Origami','Cooking','Photography'],        bio: 'Toronto graphic artist on a gap year adventure.',                                    age: 24, photo: 3  },
  { fn: 'Lena de Vries',     un: 'lenadevries8804',     city: 'Amsterdam',     country: 'Netherlands',     cc: 'NL', langs: ['Dutch','English','German'],    cats: ['cyclist','solo_traveller'],             visited: ['Belgium','Germany','Denmark','France'],       hobbies: ['Cycling','Painting','Museums'],           bio: 'Amsterdam cyclist making my way through Asia for the first time.',                   age: 27, photo: 4  },
  { fn: 'Zoe Taylor',        un: 'zoetaylor2215',       city: 'Auckland',      country: 'New Zealand',     cc: 'NZ', langs: ['English'],                     cats: ['trekker','solo_traveller'],             visited: ['Australia','Fiji','Indonesia','India'],       hobbies: ['Tramping','Rock climbing','Photography'], bio: 'Kiwi adventurer with a love for high mountains and hot curries.',                    age: 31, photo: 5  },
  { fn: 'Valentina López',   un: 'valentinalopez6619',  city: 'Mexico City',   country: 'Mexico',          cc: 'MX', langs: ['Spanish','English'],          cats: ['solo_traveller','food_tourist'],        visited: ['Cuba','Colombia','Peru','Spain','Morocco'],   hobbies: ['Street food','Salsa','Sketching'],        bio: 'Mexico City foodie and street art enthusiast travelling the world one meal at a time.',age: 28, photo: 6  },
  { fn: 'Catarina Silva',    un: 'catarinasilva3328',   city: 'Lisbon',        country: 'Portugal',        cc: 'PT', langs: ['Portuguese','English','Spanish'],cats: ['solo_traveller','road_tripper'],       visited: ['Spain','France','Morocco','Cape Verde'],      hobbies: ['Fado music','Surfing','Poetry'],          bio: 'Lisbon surfer exploring new horizons with an open heart and light backpack.',        age: 25, photo: 7  },
  { fn: 'Jiyeon Kim',        un: 'jiyeonkim9907',       city: 'Seoul',         country: 'South Korea',     cc: 'KR', langs: ['Korean','English'],            cats: ['backpacker','solo_traveller'],          visited: ['Japan','Taiwan','Thailand','Vietnam'],        hobbies: ['K-drama','Skincare','Hiking'],            bio: 'Seoul fashionista taking a gap year to discover cultures beyond the screen.',        age: 23, photo: 8  },
  { fn: 'Camila Fernández',  un: 'camilafernandez1134', city: 'Buenos Aires',  country: 'Argentina',       cc: 'AR', langs: ['Spanish','English'],          cats: ['solo_traveller','trekker'],             visited: ['Chile','Peru','Brazil','Colombia'],           hobbies: ['Tango','Hiking','Literature'],            bio: 'Buenos Aires literature student trekking Patagonia and beyond.',                     age: 22, photo: 9  },
  { fn: 'Fatima Adeyemi',    un: 'fatimaadeyemi7746',   city: 'Lagos',         country: 'Nigeria',         cc: 'NG', langs: ['English','Yoruba','French'],   cats: ['solo_traveller','backpacker'],          visited: ['Ghana','Senegal','Morocco','UAE'],            hobbies: ['Fashion','Travel blogging','Jazz'],       bio: 'Lagos fashion designer documenting solo female travel across Africa and beyond.',    age: 30, photo: 10 },
  { fn: 'Astrid Lindqvist',  un: 'astridlindqvist5542', city: 'Stockholm',     country: 'Sweden',          cc: 'SE', langs: ['Swedish','English','Norwegian'],cats: ['cyclist','runner','solo_traveller'],   visited: ['Norway','Finland','Denmark','Germany'],       hobbies: ['Cross-country skiing','Cycling','Sauna'], bio: 'Stockholm runner chasing half-marathons on every continent.',                        age: 33, photo: 11 },
  { fn: 'Zofia Kowalski',    un: 'zofiakowalski2257',   city: 'Warsaw',        country: 'Poland',          cc: 'PL', langs: ['Polish','English','Russian'],  cats: ['solo_traveller','backpacker'],          visited: ['Czech Republic','Hungary','Germany','UK'],   hobbies: ['Theatre','History','Chess'],             bio: 'Warsaw historian exploring former Soviet countries on a shoestring.',                age: 28, photo: 13 },
  { fn: 'Rina Hoffmann',     un: 'rinahoffmann8861',    city: 'Zürich',        country: 'Switzerland',     cc: 'CH', langs: ['German','French','English'],   cats: ['trekker','solo_traveller'],             visited: ['Austria','Italy','France','Norway'],          hobbies: ['Alpine hiking','Skiing','Cheese tasting'],bio: 'Zürich banker escaping spreadsheets for mountain trails.',                           age: 35, photo: 14 },
  { fn: 'Elif Yılmaz',       un: 'elifylmaz3369',       city: 'Istanbul',      country: 'Turkey',          cc: 'TR', langs: ['Turkish','English','Arabic'],  cats: ['solo_traveller','road_tripper'],        visited: ['Greece','Jordan','Egypt','Germany'],          hobbies: ['Calligraphy','Spice markets','Hamam'],   bio: 'Istanbul travel writer documenting ancient Silk Road stories.',                      age: 29, photo: 16 },
  { fn: 'Minh Nguyen',       un: 'minhnguyen4473',      city: 'Ho Chi Minh City', country: 'Vietnam',      cc: 'VN', langs: ['Vietnamese','English'],       cats: ['backpacker','solo_traveller'],          visited: ['Cambodia','Thailand','Japan','Australia'],   hobbies: ['Motorbike trips','Pho','Watercolour'],   bio: 'Saigon artist exploring Southeast Asia on two wheels.',                              age: 24, photo: 17 },
  { fn: 'Nour Hassan',       un: 'nourhassan6684',       city: 'Cairo',         country: 'Egypt',           cc: 'EG', langs: ['Arabic','English','French'],   cats: ['solo_traveller','backpacker'],          visited: ['Jordan','Morocco','Turkey','Italy'],          hobbies: ['Egyptology','Arabic calligraphy','Jazz'], bio: 'Cairo archaeologist exploring Mediterranean heritage on my days off.',               age: 27, photo: 18 },
  { fn: 'Yasmine Benali',    un: 'yasminebenali7795',   city: 'Marrakech',     country: 'Morocco',         cc: 'MA', langs: ['Arabic','French','English'],   cats: ['solo_traveller','road_tripper'],        visited: ['Spain','Portugal','Senegal','UAE'],           hobbies: ['Souk shopping','Mint tea','Pottery'],    bio: 'Marrakech pottery artist making her way through Europe for the first time.',         age: 26, photo: 19 },
  { fn: 'Maria Santos',      un: 'mariasantos2208',     city: 'Manila',        country: 'Philippines',     cc: 'PH', langs: ['Filipino','English'],          cats: ['solo_traveller','backpacker'],          visited: ['Thailand','Japan','South Korea','Australia'], hobbies: ['Island hopping','Diving','Ukulele'],     bio: 'Manila nurse exploring Asia with a mask, fins, and a ukulele.',                      age: 28, photo: 21 },
  { fn: 'Dewi Sukarno',      un: 'dewisukarno9912',     city: 'Bali',          country: 'Indonesia',       cc: 'ID', langs: ['Indonesian','Balinese','English'],cats: ['solo_traveller','trekker'],           visited: ['Singapore','Thailand','Japan','Australia'],  hobbies: ['Balinese dance','Surfing','Batik'],      bio: 'Bali dancer and surf instructor venturing beyond the island for the first time.',    age: 23, photo: 22 },
  { fn: 'Lucía Morales',     un: 'luciamorales4426',    city: 'Lima',          country: 'Peru',            cc: 'PE', langs: ['Spanish','English','Quechua'], cats: ['trekker','solo_traveller'],             visited: ['Bolivia','Chile','Ecuador','Colombia'],      hobbies: ['Inca trail','Weaving','Astronomy'],      bio: 'Lima astronomer trekking the Andes and studying stars from mountain summits.',      age: 30, photo: 23 },
]

const bothRaw = [
  { fn: 'Riya Patel',          un: 'riyapatel3341',       city: 'Delhi',         country: 'India',           cc: 'IN', langs: ['Hindi','English','Punjabi'],  tier: 'verified', occ: 'UX Designer',         edu: 'postgraduate',  cats: ['solo_traveller','backpacker'],          visited: ['Nepal','Bhutan','Sri Lanka','Germany','UK'],      hobbies: ['Sketching','Yoga','Meditation'],          bio: 'Delhi UX designer passionate about accessible travel design for women.',             age: 27, photo: 26 },
  { fn: 'Hana Yamamoto',       un: 'hanayamamoto5557',    city: 'Osaka',         country: 'Japan',           cc: 'JP', langs: ['Japanese','English'],         tier: 'verified', occ: 'Pastry Chef',         edu: 'undergraduate', cats: ['solo_traveller','road_tripper'],        visited: ['Korea','Taiwan','France','Italy'],        hobbies: ['Wagashi making','Hiking','Tea ceremony'], bio: 'Osaka pastry chef exploring dessert cultures from Paris to Seoul.',                  age: 29, photo: 27 },
  { fn: 'Lara Schneider',      un: 'laraschneider8862',   city: 'Munich',        country: 'Germany',         cc: 'DE', langs: ['German','English'],           tier: 'verified', occ: 'Physical Therapist',  edu: 'undergraduate', cats: ['runner','trekker','cyclist'],           visited: ['Austria','Switzerland','Italy','Spain'],  hobbies: ['Trail running','Beer gardens','Alpine climbing'],bio: 'Munich physio and trail runner. I host runners and trekkers passing through Bavaria.',age: 31, photo: 28 },
  { fn: 'Margaux Dupont',      un: 'margauxdupont2279',   city: 'Lyon',          country: 'France',          cc: 'FR', langs: ['French','English','Italian'], tier: 'verified', occ: 'Sommelier',           edu: 'undergraduate', cats: ['solo_traveller','food_tourist'],        visited: ['Italy','Spain','Portugal','Morocco'],    hobbies: ['Wine tasting','Cycling','Cheese'],        bio: 'Lyon sommelier hosting food and wine lovers in the gastronomic capital of France.',  age: 33, photo: 29 },
  { fn: 'Ana García',          un: 'anagarcia6693',        city: 'Madrid',        country: 'Spain',           cc: 'ES', langs: ['Spanish','English','French'], tier: 'verified', occ: 'Lawyer',              edu: 'postgraduate',  cats: ['solo_traveller','backpacker'],          visited: ['Portugal','France','Morocco','Mexico','Peru'],hobbies: ['Flamenco','Running','Art museums'],       bio: 'Madrid lawyer combining legal adventures with solo travel on every continent.',      age: 34, photo: 31 },
  { fn: 'Martina Esposito',    un: 'martinaesposito3384',  city: 'Milan',         country: 'Italy',           cc: 'IT', langs: ['Italian','English','Spanish'],tier: 'verified', occ: 'Fashion Designer',    edu: 'undergraduate', cats: ['solo_traveller','road_tripper'],        visited: ['France','Spain','Greece','Japan','Brazil'],hobbies: ['Fashion','Opera','Coffee culture'],       bio: 'Milan fashion designer hosting creative souls in my design studio apartment.',       age: 28, photo: 32 },
  { fn: 'Charlotte Davies',    un: 'charlottedavies7791', city: 'Melbourne',     country: 'Australia',       cc: 'AU', langs: ['English'],                    tier: 'verified', occ: 'Sports Physiologist', edu: 'postgraduate',  cats: ['runner','ultramarathon','trekker'],     visited: ['New Zealand','Japan','Kenya','USA','UK'], hobbies: ['Ultramarathons','Cooking','Rock climbing'],bio: 'Melbourne ultra runner hosting athletes and adventurers in my sports-friendly home.',age: 37, photo: 33 },
  { fn: 'Zara Njoroge',        un: 'zaranjoroge9906',      city: 'Mombasa',       country: 'Kenya',           cc: 'KE', langs: ['Swahili','English'],          tier: 'verified', occ: 'Marine Conservation', edu: 'postgraduate',  cats: ['trekker','solo_traveller'],             visited: ['Tanzania','South Africa','France','UK'],  hobbies: ['Coral reef research','Spearfishing','Beachcombing'],bio: 'Mombasa marine conservationist sharing my coastal city with ocean-loving travellers.',age: 29, photo: 34 },
  { fn: 'Isabella Oliveira',   un: 'isabellaoliveira4448', city: 'Rio de Janeiro',country: 'Brazil',          cc: 'BR', langs: ['Portuguese','English','Spanish'],tier:'verified', occ: 'Dancer',             edu: 'undergraduate', cats: ['solo_traveller','runner'],             visited: ['Argentina','Colombia','USA','France'],   hobbies: ['Capoeira','Beach running','Carnival'],   bio: 'Rio dancer sharing the rhythm, warmth and energy of my city with the world.',       age: 26, photo: 36 },
  { fn: 'Sirin Panya',         un: 'sirinpanya1117',       city: 'Bangkok',       country: 'Thailand',        cc: 'TH', langs: ['Thai','English'],             tier: 'verified', occ: 'Digital Nomad',       edu: 'undergraduate', cats: ['solo_traveller','backpacker'],          visited: ['Vietnam','Japan','Germany','Netherlands'],hobbies: ['Street food','Muay Thai','Photography'], bio: 'Bangkok-based digital nomad hosting fellow location-independent women.',              age: 27, photo: 37 },
  { fn: 'Rachel Thompson',     un: 'rachelthompson5563',   city: 'San Francisco', country: 'United States',   cc: 'US', langs: ['English','Spanish'],          tier: 'verified', occ: 'Software Engineer',   edu: 'postgraduate',  cats: ['solo_traveller','cyclist'],             visited: ['Canada','Mexico','Japan','UK','Germany'], hobbies: ['Hiking','Tech meetups','Cycling'],        bio: 'SF engineer cycling across countries and hosting curious female techies.',            age: 30, photo: 38 },
  { fn: 'Sophia Clark',        un: 'sophiaclark2272',      city: 'Edinburgh',     country: 'United Kingdom',  cc: 'GB', langs: ['English','Gaelic'],           tier: 'verified', occ: 'Historian',           edu: 'doctorate',     cats: ['trekker','solo_traveller'],             visited: ['Ireland','France','Scandinavia','Iceland'],hobbies: ['Castle visits','Hiking','Scottish whisky'],bio: 'Edinburgh historian hosting solo women in a quirky flat full of books and maps.',    age: 38, photo: 39 },
  { fn: 'Maya Tremblay',       un: 'mayatremblay8876',     city: 'Vancouver',     country: 'Canada',          cc: 'CA', langs: ['English','French'],           tier: 'verified', occ: 'Environmental Scientist',edu:'postgraduate', cats: ['trekker','cyclist','solo_traveller'],   visited: ['USA','New Zealand','Iceland','Norway'],   hobbies: ['Sea kayaking','Whale watching','Skiing'], bio: 'Vancouver environmental scientist hosting outdoor adventurers and nature lovers.',   age: 32, photo: 41 },
  { fn: 'Fleur van Berg',      un: 'fleurvanberg6684',     city: 'Rotterdam',     country: 'Netherlands',     cc: 'NL', langs: ['Dutch','English','German'],   tier: 'verified', occ: 'Architect',           edu: 'postgraduate',  cats: ['cyclist','solo_traveller'],             visited: ['Belgium','Germany','Denmark','France'],   hobbies: ['Architecture','Canal cycling','Jazz'],   bio: 'Rotterdam architect converting my warehouse apartment into an inspiring traveller hub.',age: 35, photo: 42 },
  { fn: 'Isla Morrison',       un: 'islamorrison3391',     city: 'Wellington',    country: 'New Zealand',     cc: 'NZ', langs: ['English','Māori'],            tier: 'verified', occ: 'Marine Ecologist',    edu: 'postgraduate',  cats: ['trekker','solo_traveller'],             visited: ['Australia','Japan','UK','Canada'],        hobbies: ['Lord of the Rings trails','Surfing','Bird watching'],bio: 'Wellington ecologist exploring Tolkien landscapes and hosting world travellers.',    age: 29, photo: 43 },
  { fn: 'Daniela Reyes',       un: 'danielareyes7797',     city: 'Guadalajara',   country: 'Mexico',          cc: 'MX', langs: ['Spanish','English'],          tier: 'verified', occ: 'Muralist',            edu: 'undergraduate', cats: ['solo_traveller','road_tripper'],        visited: ['USA','Cuba','Colombia','Spain'],          hobbies: ['Murals','Mezcal tasting','Lucha libre'], bio: 'Guadalajara muralist painting colour into every city I visit.',                      age: 27, photo: 44 },
  { fn: 'Inês Rodrigues',      un: 'inesrodrigues5509',    city: 'Porto',         country: 'Portugal',        cc: 'PT', langs: ['Portuguese','English','Spanish'],tier:'verified', occ: 'Wine Tour Guide',    edu: 'undergraduate', cats: ['solo_traveller','cyclist'],            visited: ['Spain','France','Morocco','Brazil'],      hobbies: ['Port wine','Cycling','Azulejo tiles'],   bio: 'Porto wine guide hosting cyclists and wine lovers exploring the Douro Valley.',      age: 31, photo: 46 },
  { fn: 'Soyeon Park',         un: 'soyeonpark2268',       city: 'Busan',         country: 'South Korea',     cc: 'KR', langs: ['Korean','English'],           tier: 'verified', occ: 'Film Director',       edu: 'postgraduate',  cats: ['solo_traveller','backpacker'],          visited: ['Japan','Taiwan','Germany','France'],      hobbies: ['Indie cinema','Street food','Night markets'],bio: 'Busan film director hosting cinephiles and storytellers in my sea-view apartment.',  age: 32, photo: 47 },
  { fn: 'Florencia Romero',    un: 'florenciaromero9923',  city: 'Córdoba',       country: 'Argentina',       cc: 'AR', langs: ['Spanish','English'],          tier: 'verified', occ: 'Veterinarian',        edu: 'postgraduate',  cats: ['trekker','solo_traveller'],             visited: ['Chile','Bolivia','Peru','Spain'],         hobbies: ['Horseback riding','Folklore','Stargazing'],bio: 'Córdoba vet hosting nature lovers and Andean trekkers at my mountain-edge home.',   age: 30, photo: 48 },
  { fn: 'Chidinma Okafor',     un: 'chidinmaokafor6637',   city: 'Abuja',         country: 'Nigeria',         cc: 'NG', langs: ['English','Igbo','Hausa'],     tier: 'verified', occ: 'Public Health Researcher',edu:'doctorate', cats: ['solo_traveller','backpacker'],        visited: ['Ghana','Kenya','Morocco','UK','UAE'],     hobbies: ['Afrobeats','Public health advocacy','Cooking'],bio: 'Abuja public health researcher hosting curious women exploring West Africa.',        age: 33, photo: 49 },
]

// ── Build user objects ────────────────────────────────────────────────────────
async function buildUsers(rawArr, role, password) {
  return rawArr.map(u => ({
    _id: oid(),
    email: u.un + SEED_DOMAIN,
    password,
    fullName: u.fn,
    username: u.un,
    age: u.age,
    gender: 'female',
    city: u.city,
    country: u.country,
    countryCode: u.cc,
    languages: u.langs,
    education: u.edu || 'undergraduate',
    occupation: u.occ || 'Traveller',
    bio: u.bio,
    profilePhotoUrl: `${PHOTO_BASE}/${u.photo}.jpg`,
    travellerCategories: u.cats,
    countriesVisited: u.visited || [],
    hobbies: u.hobbies || [],
    verificationTier: u.tier || 'basic',
    role,
    onboardingCompleted: true,
    onboardingStep: 5,
    emailVerified: true,
    isActive: true,
    totalStays: role === 'guest' ? Math.floor(Math.random() * 5) : Math.floor(Math.random() * 8),
    totalHostings: role === 'host' || role === 'both' ? Math.floor(Math.random() * 10) + 1 : 0,
    averageRating: role !== 'guest' ? parseFloat((3.8 + Math.random() * 1.2).toFixed(1)) : 0,
    totalReviews: role !== 'guest' ? Math.floor(Math.random() * 15) + 1 : 0,
    lastActive: daysAgo(Math.floor(Math.random() * 14)),
    emergencyContactName: 'Emergency Contact',
    emergencyContactPhone: '+11234567890',
    emergencyContactRelationship: 'family',
  }))
}

// ── Host Profiles ─────────────────────────────────────────────────────────────
const hostProfileDefs = [
  // Hosts (10)
  { accType: 'private_room',   max: 2, offerings: ['wifi','breakfast','city_guide'], rules: 'No smoking inside. Quiet after 10 PM. Shoes off at the door.', femOnly: true,  city: 'Mumbai',        country: 'India',      respRate: 95, respTime: 2,  stays: 12 },
  { accType: 'shared_room',    max: 1, offerings: ['wifi','city_guide'],             rules: 'Respect shared spaces. No guests after midnight.',            femOnly: true,  city: 'Tokyo',         country: 'Japan',      respRate: 98, respTime: 1,  stays: 9  },
  { accType: 'private_room',   max: 2, offerings: ['wifi','breakfast','laundry'],    rules: 'Keep the flat tidy. Recycle properly (Germany rules!).',      femOnly: false, city: 'Berlin',        country: 'Germany',    respRate: 100,respTime: 3,  stays: 18 },
  { accType: 'couch',          max: 1, offerings: ['wifi','breakfast'],              rules: 'Light sleeper — please be quiet after 11 PM.',                femOnly: true,  city: 'Paris',         country: 'France',     respRate: 90, respTime: 6,  stays: 7  },
  { accType: 'private_room',   max: 2, offerings: ['wifi','city_guide','airport_pickup'],rules: 'Love to host! Just let me know your schedule in advance.', femOnly: true,  city: 'Barcelona',     country: 'Spain',      respRate: 97, respTime: 2,  stays: 14 },
  { accType: 'private_room',   max: 2, offerings: ['wifi','dinner','city_guide'],    rules: 'Dinner together is optional but highly recommended!',          femOnly: false, city: 'Rome',          country: 'Italy',      respRate: 93, respTime: 4,  stays: 11 },
  { accType: 'private_room',   max: 3, offerings: ['wifi','breakfast','laundry','bicycle'],rules: 'Beach house rules — sandy feet welcome, big smiles required.', femOnly: true, city: 'Sydney',  country: 'Australia',  respRate: 99, respTime: 1,  stays: 22 },
  { accType: 'shared_room',    max: 2, offerings: ['wifi','city_guide','airport_pickup'],rules: 'Women only, verified travellers preferred. Swahili lessons optional!', femOnly: true, city: 'Nairobi', country: 'Kenya', respRate: 88, respTime: 8, stays: 6 },
  { accType: 'private_room',   max: 2, offerings: ['wifi','breakfast','city_guide'], rules: 'Mi casa es tu casa! Bring your stories and I\'ll bring the coffee.', femOnly: false, city: 'São Paulo', country: 'Brazil', respRate: 96, respTime: 3, stays: 9 },
  { accType: 'couch',          max: 1, offerings: ['wifi','breakfast','city_guide'], rules: 'Mindful space — meditation and yoga encouraged. No alcohol.',  femOnly: true,  city: 'Chiang Mai',    country: 'Thailand',   respRate: 94, respTime: 5,  stays: 8  },
  // Both users (20)
  { accType: 'private_room',   max: 2, offerings: ['wifi','city_guide'],             rules: 'Respectful guests only. Feel free to join me for chai!',       femOnly: true,  city: 'Delhi',         country: 'India',      respRate: 92, respTime: 4,  stays: 5  },
  { accType: 'couch',          max: 1, offerings: ['wifi','breakfast'],              rules: 'Early riser household. Perfect for Japan sunrise lovers.',      femOnly: true,  city: 'Osaka',         country: 'Japan',      respRate: 97, respTime: 2,  stays: 7  },
  { accType: 'private_room',   max: 2, offerings: ['wifi','laundry','bicycle'],      rules: 'Runners welcome — I can suggest the best trail routes in Bavaria.', femOnly: false, city: 'Munich',   country: 'Germany',    respRate: 100,respTime: 2,  stays: 12 },
  { accType: 'private_room',   max: 2, offerings: ['wifi','dinner','city_guide'],    rules: 'Wine and cheese hour every evening — join me!',                femOnly: false, city: 'Lyon',          country: 'France',     respRate: 95, respTime: 3,  stays: 8  },
  { accType: 'shared_room',    max: 2, offerings: ['wifi','city_guide','airport_pickup'],rules: 'Verified women travellers only. Madrid at your feet!',      femOnly: true,  city: 'Madrid',        country: 'Spain',      respRate: 98, respTime: 2,  stays: 10 },
  { accType: 'private_room',   max: 2, offerings: ['wifi','city_guide'],             rules: 'Design-minded guests welcome — my flat is a creative space.',  femOnly: true,  city: 'Milan',         country: 'Italy',      respRate: 93, respTime: 5,  stays: 7  },
  { accType: 'private_room',   max: 2, offerings: ['wifi','breakfast','laundry'],    rules: 'Athlete-friendly — foam roller and ice bath available!',       femOnly: false, city: 'Melbourne',     country: 'Australia',  respRate: 99, respTime: 1,  stays: 15 },
  { accType: 'private_room',   max: 1, offerings: ['wifi','city_guide','airport_pickup'],rules: 'Mombasa pace — slow mornings, rich sunsets.',                femOnly: true,  city: 'Mombasa',       country: 'Kenya',      respRate: 87, respTime: 10, stays: 4  },
  { accType: 'shared_room',    max: 2, offerings: ['wifi','breakfast','city_guide'], rules: 'Carnival-ready home. Samba lessons available upon request!',   femOnly: false, city: 'Rio de Janeiro', country: 'Brazil',    respRate: 91, respTime: 6,  stays: 6  },
  { accType: 'couch',          max: 1, offerings: ['wifi','city_guide'],             rules: 'Digital nomad space — strong WiFi, silent work hours 9–12.',   femOnly: true,  city: 'Bangkok',       country: 'Thailand',   respRate: 95, respTime: 3,  stays: 9  },
  { accType: 'private_room',   max: 2, offerings: ['wifi','breakfast','bicycle'],    rules: 'Tech-friendly home in the Mission. Bring your laptop!',        femOnly: false, city: 'San Francisco', country: 'United States', respRate: 97, respTime: 2, stays: 11 },
  { accType: 'private_room',   max: 2, offerings: ['wifi','city_guide'],             rules: 'Books everywhere — bookworms especially welcome.',             femOnly: true,  city: 'Edinburgh',     country: 'United Kingdom', respRate: 96, respTime: 4, stays: 13 },
  { accType: 'private_room',   max: 3, offerings: ['wifi','breakfast','laundry','bicycle'],rules: 'Outdoor gear available. Kayaks and bikes in the garage.', femOnly: false, city: 'Vancouver',     country: 'Canada',     respRate: 100,respTime: 2,  stays: 16 },
  { accType: 'private_room',   max: 2, offerings: ['wifi','city_guide'],             rules: 'Design lovers paradise. Architecture tours offered!',          femOnly: false, city: 'Rotterdam',     country: 'Netherlands', respRate: 94, respTime: 3, stays: 8  },
  { accType: 'private_room',   max: 2, offerings: ['wifi','breakfast','city_guide'], rules: 'Middle-earth vibes. LOTR trail maps provided.',               femOnly: true,  city: 'Wellington',    country: 'New Zealand', respRate: 98, respTime: 2, stays: 10 },
  { accType: 'couch',          max: 1, offerings: ['wifi','city_guide'],             rules: 'Artist space — paints and brushes welcome.',                  femOnly: false, city: 'Guadalajara',   country: 'Mexico',     respRate: 90, respTime: 5,  stays: 5  },
  { accType: 'private_room',   max: 2, offerings: ['wifi','breakfast','bicycle'],    rules: 'Cyclists welcome — bike lock and tools provided.',            femOnly: false, city: 'Porto',         country: 'Portugal',   respRate: 97, respTime: 3,  stays: 9  },
  { accType: 'private_room',   max: 2, offerings: ['wifi','city_guide'],             rules: 'Film-lover home. Movie nights every Friday.',                 femOnly: true,  city: 'Busan',         country: 'South Korea', respRate: 93, respTime: 4, stays: 7  },
  { accType: 'private_room',   max: 2, offerings: ['wifi','breakfast','city_guide'], rules: 'Mountain-edge home. Horses available for trail rides.',       femOnly: false, city: 'Córdoba',       country: 'Argentina',  respRate: 89, respTime: 8,  stays: 6  },
  { accType: 'private_room',   max: 2, offerings: ['wifi','city_guide','airport_pickup'],rules: 'West African warmth and hospitality guaranteed.', femOnly: true,  city: 'Abuja',         country: 'Nigeria',    respRate: 91, respTime: 6,  stays: 5  },
]

// ── Blog Posts ────────────────────────────────────────────────────────────────
const blogDefs = [
  {
    title: 'Solo Trekking in the Himalayas: What No One Tells You',
    cat: 'trekking', tags: ['himalayas','solo trekking','altitude sickness','safety'],
    excerpt: 'Six months of planning, three weeks of blisters, and one life-changing summit. Here is everything I wish I knew before my first solo Himalayan trek.',
    content: `<h2>The Call of the Mountains</h2><p>I had been planning my solo Himalayan trek for six months when my trekking partner pulled out two weeks before departure. The first reaction was panic. The second was liberation. I went alone, and it was the best decision of my life.</p><h2>Before You Go: The Honest Truth About Altitude</h2><p>Everyone talks about altitude sickness in passing — a footnote in most travel guides. Let me be direct: acclimatise properly or go home early. I spent two extra days in Namche Bazaar feeling like I had the worst flu of my life. Those two days saved my trek. The golden rule is never ascend more than 300–500m per day above 3000m, and descend immediately if symptoms worsen.</p><h2>Solo & Female: The Double Question</h2><p>The two questions every solo female trekker faces: "Is it safe?" and "Are you not scared?" Both deserve honest answers. Yes, it is safe — with preparation. Hire a licensed porter or guide from a reputable agency, register at TIMS checkpoints, and share your itinerary with someone at home. As for being scared? Fear keeps you alert. It is not an obstacle; it is a tool.</p><h2>The Unspoken Realities</h2><ul><li>Tea house toilets vary wildly in quality. Carry your own TP and hand sanitiser, always.</li><li>Charging your devices costs money above base camp. Budget for it.</li><li>Weather changes in minutes. Your rain jacket is not optional.</li><li>The silence above 4000m is indescribable. Protect it — keep your headphones in your bag for at least one day.</li></ul><h2>The Summit Moment</h2><p>Standing on Thorong La Pass at 5416m, with the wind howling and my lungs burning, I cried. Not from pain but from the realisation that I was capable of more than I had ever imagined. No partner, no itinerary app, no safety net — just my legs, my lungs, and the mountain. That is what solo trekking gives you: the unedited version of yourself.</p><p>Would I recommend it? Unreservedly, to every woman who has ever looked at a mountain and wondered.</p>`,
    readTime: 6, views: 1842, likes: 203,
  },
  {
    title: 'Female Solo Travel Safety: 15 Tips That Actually Work',
    cat: 'safety', tags: ['safety tips','solo travel','female safety','self defence'],
    excerpt: 'Eleven years of solo travel across 47 countries. These are the safety habits that have kept me safe — not the useless advice you usually read.',
    content: `<h2>The Safety Conversation We Need to Have</h2><p>Most solo female travel safety guides are written either by people who have never travelled alone or by people so risk-averse they make every destination sound like a war zone. I have been solo travelling for eleven years across 47 countries. Let me share what actually works.</p><h2>The 15 Habits That Keep Me Safe</h2><ol><li><strong>Trust your gut, immediately.</strong> If something feels wrong, it is wrong. No polite hesitation required. Walk away, hang up, close the door.</li><li><strong>Know your exits before you need them.</strong> When entering any venue, locate two exits. This is not paranoia — it is preparedness.</li><li><strong>Download offline maps before arrival.</strong> Google Maps offline, Maps.me, and OsmAnd have saved me more times than I can count. Being visibly lost makes you a target.</li><li><strong>Use the hotel safe, always.</strong> Never leave your passport in your bag when you go out. Losing a phone is inconvenient. Losing your passport in a foreign country is a catastrophe.</li><li><strong>Dress codes are not about modesty — they are about blending in.</strong> Observe what local women wear. Matching the local style reduces unwanted attention significantly.</li><li><strong>Share your live location with someone you trust.</strong> WhatsApp location sharing is free. Use it whenever you take private transport.</li><li><strong>The back seat of taxis and rideshares is not just comfort.</strong> It gives you a door on each side and distance from the driver.</li><li><strong>Night buses are not the same as night trains.</strong> Night buses are more vulnerable. Stick to reputable companies, book window seats in the middle rows, and stay alert.</li><li><strong>Confidence is your best defence.</strong> Walk purposefully, maintain awareness, make eye contact with vendors from a distance (not up close), and project that you know exactly where you are going — even when you do not.</li><li><strong>Alcohol changes your risk profile dramatically.</strong> Know your limits. Designate one night off per week if you are doing extended trips.</li><li><strong>Join women-only travel groups in each destination.</strong> Local women in Facebook groups, Meetup apps, and platforms like SisterRoam know the safest neighbourhoods, the scams, and the hidden gems that no guidebook mentions.</li><li><strong>Your hotel front desk is more useful than you think.</strong> They know the neighbourhood. Ask them which streets to avoid after dark.</li><li><strong>Learn five words in every local language.</strong> No, stop, help, thank you, and the word for police. People respond differently when you speak even a word of their language.</li><li><strong>Basic self-defence is worth the weekend course.</strong> Not to fight — to escape and create distance. One afternoon can change your confidence level permanently.</li><li><strong>The most dangerous moment is not when you think it is.</strong> Statistics consistently show the highest risk of incidents for travellers is in the first 48 hours — jet-lagged, unfamiliar, disoriented. Slow down for the first two days.</li></ol><p>Safety and freedom are not opposites. With the right habits, they are partners. Travel boldly, travel wisely, travel far.</p>`,
    readTime: 8, views: 3241, likes: 487,
  },
  {
    title: 'Cycling Through Europe as a Woman: A Complete Guide',
    cat: 'cycling', tags: ['cycling europe','bike touring','eurovelo','female cyclists'],
    excerpt: 'I cycled 4000km across 8 European countries last summer. Here is the practical, honest guide I wish had existed before I clipped in.',
    content: `<h2>Why I Decided to Cycle Europe</h2><p>My decision to cycle from Berlin to Lisbon was not born from grand adventure planning. It was born from a missed train, a borrowed bike, and the realisation that slow travel is the only travel that actually teaches you anything. That first unplanned day turned into a 12-week, 4000km journey across 8 countries.</p><h2>Route Planning: The EuroVelo Network</h2><p>The EuroVelo network comprises 17 long-distance cycling routes crossing the continent. EV3 (the Pilgrims Route) from Trondheim to Seville and EV6 (the Atlantic-Black Sea route) are the most popular and best-maintained. Download the EuroVelo app and plan in 80–100km daily segments, never more — especially in the first two weeks while your body adapts.</p><h2>The Bike Setup That Matters</h2><p>You do not need a €3000 touring bike. You need a reliable bike with wide tyres (at least 35c), a solid rack system, and quality panniers. I used a second-hand Trek 520 with Ortlieb waterproof panniers. Total kit weight: 18kg including camping gear. The saddle is the most important component. Get a professional fitting before you leave.</p><h2>Camping vs. Hospitality Exchange</h2><p>Wild camping is legal in Scandinavia and Scotland (right to roam), tolerated in many rural areas, and forbidden in most Western European countries. I alternated between campsites (€8–18/night), WarmShowers hosts (free), and SisterRoam hosts (free — my personal favourite because the community is entirely women). The SisterRoam hosts I stayed with in Lyon and Porto gave me city maps, local route tips, and fresh legs for the next morning.</p><h2>Safety on the Road</h2><p>Visibility is everything. High-vis vest, front and rear lights (always, even in daytime on roads), and a mirror on your handlebars. In traffic-heavy areas, always follow the line of local cyclists — they know which junctions are dangerous. For solo female cyclists specifically: trust the local cycling community. WarmShowers forums and cycling Facebook groups are invaluable for route safety intel.</p><h2>What You Learn at 15km/h</h2><p>You cannot cycle 4000km and remain the same person. By kilometre 1000, the noise in your head stops. By kilometre 2000, you understand your body completely. By kilometre 3000, you understand that most of what you worried about before the trip was invented. What stays with you is not the distance — it is the 3am fog in the Black Forest, the fisherman on the Loire who gave you half his lunch, and the moment in Porto when the Atlantic appeared around a bend and you wept with a stranger who cycled from Copenhagen.</p>`,
    readTime: 9, views: 2107, likes: 318,
  },
  {
    title: 'Why Hospitality Exchange Changed My Relationship With Travel',
    cat: 'solo_travel', tags: ['hospitality exchange','couchsurfing','women travel community','connections'],
    excerpt: 'I used to stay in hostels for the community. Then I discovered hospitality exchange — and realised I had been getting shallow connections all along.',
    content: `<h2>The Transactional Hostel Problem</h2><p>I spent years staying in hostels in the belief that they gave me community. And they did — but a particular, transactional kind. You meet someone, share a dorm room, perhaps a meal, and then you both move on. The connection rarely outlasts the checkout time.</p><h2>My First Hospitality Exchange</h2><p>My first SisterRoam stay was in Lyon, with Margaux, a sommelier who greeted me at the door with two glasses of Beaujolais and the words "First, we drink. Then you tell me your story." Over three days, she took me to a wine négociant, cooked a bouchonnaise dinner for six of her friends and introduced me to all of them, and on the last morning walked me to the train station herself. I left Lyon knowing a person, not a city.</p><h2>What Hospitality Exchange Actually Gives You</h2><p>It gives you an insider. Not a guidebook, not a TripAdvisor review — a living, breathing person who is invested in your experience of their city because they share your values as a traveller. Hosts on women-only platforms like SisterRoam are there for connection, not commerce. The verification process filters for people who take safety seriously on both sides.</p><h2>The Reciprocal Gift</h2><p>Hosting is the other side of the coin. When you host, you receive the world in your living room. In the past year, I have hosted a Malaysian cyclist mid-EuroVelo, a Nigerian researcher attending a conference, and an Argentine veterinarian who brought me a bottle of Malbec and taught me to make empanadas. My flat is richer for every person who has slept on my pullout.</p><h2>For Those Who Are Nervous</h2><p>The verification system exists for a reason. Read profiles carefully. Start with a short stay — one or two nights. Message in advance and have a real conversation. Trust the community reviews. And if anything ever feels off, you can decline or leave. Platforms like SisterRoam take safety seriously because the community demands it.</p><p>Hospitality exchange will not make every trip perfect. But it will make almost every trip meaningful. That is a different, better thing.</p>`,
    readTime: 7, views: 1563, likes: 271,
  },
  {
    title: 'Street Food for Solo Female Travellers: Eating Safely and Adventurously',
    cat: 'food', tags: ['street food','food safety','solo dining','Thailand food'],
    excerpt: 'A decade of street food across 40 countries has taught me exactly how to eat boldly without getting sick. Here is the system I use everywhere.',
    content: `<h2>The Most Common Street Food Mistake</h2><p>New travellers almost universally make the same mistake: they avoid street food entirely, eat at expensive tourist restaurants, and complain that the food was nothing like they expected. Or they eat everything indiscriminately on day one, spend day two in the guesthouse bathroom, and become cautious forever after. Neither approach is necessary.</p><h2>The Traffic Light System</h2><p>I apply a simple visual traffic light system to every street food stall:</p><ul><li><strong>Green (eat confidently):</strong> High turnover — a queue of local people means the food is fresh. Food cooked to order in front of you. Separate utensils for raw and cooked ingredients. Water kept in closed containers.</li><li><strong>Amber (observe first):</strong> Some customers but not a queue. Food that has been sitting in a bain-marie for an uncertain period. Stalls near drains or standing water. No visible handwashing facility nearby.</li><li><strong>Red (skip this one):</strong> No customers despite low price. Pre-peeled fruit left in the open air. Raw proteins at room temperature. The vendor looks unwell.</li></ul><h2>Chiang Mai: My Street Food Classroom</h2><p>Chiang Mai was where I learned to eat with genuine courage and genuine wisdom simultaneously. Nattaya, my SisterRoam host, took me to Warorot Market at 6am and made me watch the vendors before eating. "Notice who the older Thai women choose," she said. "They know." She was right. The stall with the longest queue of grey-haired ladies selling khao tom (rice soup) at 6:15am was the best thing I ate in three weeks of Thailand.</p><h2>Practical Safety Rules</h2><ol><li>Peel your own fruit — papaya, mango, pineapple cut to order are fine; pre-cut fruit in open bowls less so.</li><li>Check that freshly cooked food steams — steam is your visual sign that it reached a safe temperature.</li><li>Carry oral rehydration sachets. Not because you will need them but because having them prevents the anxiety that makes you miss the adventure.</li><li>Know the word for "no chili" and "no meat" in the local language if you have dietary restrictions. Google Translate voice mode plus a little practice gets you there.</li><li>Eat when the locals eat. Lunch at 12:30, not 3pm when the food has been sitting.</li></ol><h2>The Reward</h2><p>A plastic stool at a Bangkok night market. A 40-baht bowl of pad see ew. The vendor's grandmother watching Thai soap operas on a phone propped against the soy sauce bottle. You cannot buy this experience inside a restaurant. You can only earn it by showing up, observing, and being willing to trust.</p>`,
    readTime: 7, views: 2388, likes: 356,
  },
  {
    title: 'Running Marathons on 6 Continents: A Woman\'s Journey',
    cat: 'running', tags: ['marathon','ultramarathon','running travel','world marathons'],
    excerpt: 'From the Boston Marathon to the Great Wall and from Kilimanjaro to Antarctica — running has taken me everywhere I never expected to go.',
    content: `<h2>How Running Became My Travel Method</h2><p>I ran my first marathon at 28 out of a bet with a colleague. I ran my sixth-continent marathon at 37 because I could not imagine stopping. Running is not just how I train — it is how I understand new places. You cannot run through a city without learning its hills, its working class neighbourhoods, its parks at 6am, its life before tourists arrive.</p><h2>The Six Continents</h2><p><strong>Europe — Berlin Marathon:</strong> My first international race. 45,000 runners through the Brandenburg Gate. I cried at kilometre 38, not from pain but from the incomprehensible beauty of Brandenburg Gate at running pace.</p><p><strong>North America — Boston Marathon:</strong> Earned entry after qualifying at Rotterdam. Heartbreak Hill is precisely as described. The crowd at Wellesley College is the loudest human sound I have heard in my life.</p><p><strong>Asia — Great Wall Marathon, China:</strong> 5,164 steps. Elevation gain that makes your legs weep. Views that make you forget the weeping. Brutally, magnificently hard.</p><p><strong>Africa — Kilimanjaro Marathon:</strong> Starting at 900m altitude in Moshi, with the mountain above you. The finish line view of Kibo summit is worth every training kilometre.</p><p><strong>South America — Patagonian International Marathon:</strong> 42km through Torres del Paine. Wind that pushes you sideways on exposed ridgelines. Pumas spotted by two runners. The most beautiful race course in the world.</p><p><strong>Antarctica — Antarctic Ice Marathon:</strong> -20°C. Crampons. Four layers. The most surreal, silent, humbling run of my life. Finished in 5h12m. The certificate reads "You ran at the bottom of the world" and I have it framed above my desk.</p><h2>Hospitality Exchange and Running: A Perfect Partnership</h2><p>Running tourism is real and growing. Platforms like SisterRoam have connected me with local runner-hosts in six cities who showed me running routes no app could find — the trail along the Yarra River before Melbourne wakes up, the Bosphorus path before Istanbul traffic starts, the city walls of Xi'an at sunset. Staying with Charlotte in Melbourne before the Gold Coast Marathon gave me a local training partner, a physio pre-race consult, and a home-cooked pasta dinner the night before. That is not accommodation — that is support.</p>`,
    readTime: 8, views: 1927, likes: 289,
  },
]

// ── Community Posts ───────────────────────────────────────────────────────────
const communityPostDefs = [
  { cat: 'safety_tips',      text: '🔒 Safety tip for first-timers: always download offline maps before you arrive in a new country! I use Maps.me for hiking and Google Maps offline for cities. Being visibly lost = being a target. Stay prepared, stay safe!' },
  { cat: 'trip_planning',    text: 'Planning a solo trip to Southeast Asia for the first time — thinking Thailand → Vietnam → Cambodia over 6 weeks. Would love recommendations from anyone who has done this route! Especially looking for female-friendly guesthouses and SisterRoam hosts along the way 🙏' },
  { cat: 'looking_for_host', text: 'Looking for a host in Berlin for 3 nights (May 10–13). I\'m a verified solo traveller from India, arriving for a design conference. Happy to bring chai spices and cook an Indian dinner in exchange! 🇮🇳☕' },
  { cat: 'achievements',     text: 'Just completed my first solo trek — 5 days on the Annapurna Circuit in Nepal! 🏔️ Never thought I could do it alone but the SisterRoam community\'s encouragement pushed me. To every woman wondering if she\'s capable: you are. Go.' },
  { cat: 'general',          text: 'Hot take: the best travel advice always comes from your host, not a guidebook. My host in Nairobi took me to a neighbourhood market that does not appear on any app. The best ugali I have eaten in my life. Hospitality exchange > hotels, every time.' },
  { cat: 'hosting_offer',    text: 'Offering hosting in Porto, Portugal for June and July! I have a private room with mountain-view balcony, strong wifi, and a cellar full of port wine. Cyclists and trekkers especially welcome — the Camino de Santiago passes right through! 🍷🚴' },
  { cat: 'questions',        text: 'Question for the community: how do you deal with loneliness on long solo trips? I am two months into a 6-month journey and some evenings are genuinely hard. What are your strategies?' },
  { cat: 'safety_tips',      text: 'Reminder to always share your live location with a trusted person when taking taxis or rideshares in unfamiliar cities. WhatsApp location sharing is free and takes 10 seconds. No shame in using it every single time.' },
  { cat: 'achievements',     text: 'Officially a SisterRoam host! Spent the weekend preparing my spare room for my first guest arriving from Brazil next week. Stocked the fridge, printed a local neighbourhood map, wrote a welcome note. So excited to be part of this beautiful community! 🌸' },
  { cat: 'trip_planning',    text: 'Travel budget breakdown for 3 months in South America (Argentina, Chile, Peru) — AMA! I did it on ~$40/day including accommodation thanks to SisterRoam hosts who saved me at least $800. Happy to share the full breakdown if useful.' },
  { cat: 'general',          text: 'The most underrated part of solo female travel is the friendships. I met my best friend on a SisterRoam stay in Tokyo 3 years ago. She visited me in Melbourne last year. We are planning a cycling trip across Japan together next spring. Travel gives you people.' },
  { cat: 'questions',        text: 'Any recommendations for the best country to do a solo cycling trip as a first-timer? Thinking flat terrain, safe roads, good hospitality exchange community. Netherlands or Denmark? Open to other suggestions from experienced cyclists in the community!' },
]

// ── Hosting Request conversations ─────────────────────────────────────────────
const conversationTemplates = [
  {
    msg: 'Hi! I am planning to visit Tokyo for 4 days next month for cherry blossom season. I love cycling and would love any tips you have for exploring the city. I am a verified traveller with good references. Would you be happy to host me?',
    status: 'accepted',
    convo: [
      { from: 'guest', text: 'Hi! I am planning to visit Tokyo for 4 days next month for cherry blossom season. I love cycling and would love any tips you have for exploring the city. I am a verified traveller with good references. Would you be happy to host me?' },
      { from: 'host',  text: 'Hello! Cherry blossom season is magical here. I would love to host you! I have a shared room available and my bicycle if you need it. What dates are you thinking?' },
      { from: 'guest', text: 'Amazing! I am thinking April 3 to 7. I will book the flights once you confirm. I can cook a meal one evening to say thank you — I make a great Thai green curry!' },
      { from: 'host',  text: 'Thai green curry sounds wonderful! April 3–7 works perfectly. I will have the room ready. I will send you the neighbourhood guide and a list of the best hanami spots this week.' },
      { from: 'guest', text: 'You are so kind! I cannot wait. See you in April 🌸' },
    ],
  },
  {
    msg: 'Hello! I am coming to Berlin for a week to explore the cycling trails and the art scene. I am an architect from Netherlands and would love to meet a fellow creative. Do you have space for me early June?',
    status: 'accepted',
    convo: [
      { from: 'guest', text: 'Hello! I am coming to Berlin for a week to explore the cycling trails and the art scene. I am an architect from Netherlands and would love to meet a fellow creative. Do you have space for me early June?' },
      { from: 'host',  text: 'A fellow creative — perfect! I have a private room free June 2–9. The cycling infrastructure here is brilliant and I know all the underground gallery openings too.' },
      { from: 'guest', text: 'This sounds ideal. I will bring Dutch cheese and stroopwafels as a contribution to the household!' },
      { from: 'host',  text: 'Ha! Stroopwafels are more than welcome. Confirmed for June 2–9. I will send you my address and access code closer to the date.' },
    ],
  },
  {
    msg: 'Hi Sophie, your Paris listing looks wonderful! I am visiting for 3 nights in July for a museum tour. I am a quiet, tidy guest with good reviews. Would love to stay in Montmartre if possible!',
    status: 'pending',
    convo: [
      { from: 'guest', text: 'Hi Sophie, your Paris listing looks wonderful! I am visiting for 3 nights in July for a museum tour. I am a quiet, tidy guest with good reviews. Would love to stay in Montmartre if possible!' },
    ],
  },
  {
    msg: 'Hello! I am a runner doing a training camp in Barcelona before a half-marathon. I would love to stay with someone who knows the best morning running routes. Can you help?',
    status: 'accepted',
    convo: [
      { from: 'guest', text: 'Hello! I am a runner doing a training camp in Barcelona before a half-marathon. I would love to stay with someone who knows the best morning running routes. Can you help?' },
      { from: 'host',  text: 'A runner! I run the Parc de la Ciutadella loop every morning at 6:30am — you are welcome to join me. When are you arriving?' },
      { from: 'guest', text: 'I arrive the 14th and leave the 18th. A 6:30 run sounds perfect! I usually do 12km in the mornings.' },
      { from: 'host',  text: 'Perfect! The Ciutadella to Barceloneta beach route is 12km exactly. Confirmed — see you the 14th! I will leave a key under the mat if I am out when you arrive.' },
      { from: 'guest', text: 'Thank you so much Carmen! I just sent a small thank-you gift to your Wise account. So grateful.' },
      { from: 'host',  text: 'That is so sweet, not necessary at all! Just run fast and tell me all about the race 🏃‍♀️' },
    ],
  },
  {
    msg: 'Ciao Giulia! I am coming to Rome for 5 days to do a food tour — my dream trip. Your blog makes your local knowledge sound incredible. Do you have space in late August?',
    status: 'completed',
    convo: [
      { from: 'guest', text: 'Ciao Giulia! I am coming to Rome for 5 days to do a food tour — my dream trip. Your blog makes your local knowledge sound incredible. Do you have space in late August?' },
      { from: 'host',  text: 'Benvenuta! August 20–25 works for me. I will take you to a restaurant that has had the same 80-year-old chef since 1962. No tourists, no English menu. Just Roman magic.' },
      { from: 'guest', text: 'I am already emotional about this! Confirmed — August 20 arrival, evening flight.' },
      { from: 'host',  text: 'Perfect. I will make cacio e pepe on your arrival night. Safe travels!' },
      { from: 'guest', text: 'The cacio e pepe was life-changing. Thank you for the most memorable travel week of my life, Giulia 🍝❤️' },
    ],
  },
  {
    msg: 'Hi Emma! I am a marine biology student from UK visiting Sydney for a diving certification course. Your profile says you do scuba diving — I would love to meet you! Staying 6 nights if possible.',
    status: 'accepted',
    convo: [
      { from: 'guest', text: 'Hi Emma! I am a marine biology student from UK visiting Sydney for a diving certification course. Your profile says you do scuba diving — I would love to meet you! Staying 6 nights if possible.' },
      { from: 'host',  text: 'A fellow marine bio person — fantastic! I have a private room available. Which dive school are you doing your cert with? I may know your instructor.' },
      { from: 'guest', text: 'Pro Dive Sydney. I am so excited to explore the Pacific! Is Manly Beach easy to get to from your place?' },
      { from: 'host',  text: 'Manly is 20 minutes by ferry — the ride itself is beautiful. Confirmed for your dates. I have spare wetsuits in two sizes if you need to borrow one.' },
    ],
  },
  {
    msg: 'Habari Amina! I am visiting Nairobi for a safari planning trip and would love to meet someone with your knowledge of East African wildlife. 3 nights from 5 September. Is that possible?',
    status: 'declined',
    convo: [
      { from: 'guest', text: 'Habari Amina! I am visiting Nairobi for a safari planning trip and would love to meet someone with your knowledge of East African wildlife. 3 nights from 5 September. Is that possible?' },
      { from: 'host',  text: 'Habari! I am so sorry — I will be on a guided safari myself that week and my flat will be locked up. I hope you can find another host. Try the SisterRoam community in Kenya Facebook group — there are several wonderful hosts there.' },
      { from: 'guest', text: 'No worries at all! I hope your safari is magical. I will try the group. Thank you for the tip!' },
    ],
  },
  {
    msg: 'Hi Fernanda! I am coming to São Paulo for Carnival and looking for a local guide and safe place to stay. I am a solo traveller from UK with 4 years of travel experience. 5 nights — is this possible?',
    status: 'completed',
    convo: [
      { from: 'guest', text: 'Hi Fernanda! I am coming to São Paulo for Carnival and looking for a local guide and safe place to stay. I am a solo traveller from UK with 4 years of travel experience. 5 nights — is this possible?' },
      { from: 'host',  text: 'Bem-vinda! Carnival in SP is electric. I have a private room and I will take you to the blocos (street parties) I go to with my friends — no tourists, just pure sambão. Confirmed!' },
      { from: 'guest', text: 'This is a dream! What should I pack? First time in Brazil and I want to get it right.' },
      { from: 'host',  text: 'Light clothes, good shoes you do not mind getting dirty, sunscreen SPF 50+, and your best dancing spirit. The rest I have covered 🇧🇷' },
      { from: 'guest', text: 'Fernanda you were the best part of Brazil. Thank you, thank you, thank you. I am already planning to come back.' },
    ],
  },
  {
    msg: 'Sawadee ka Nattaya! I am a yoga teacher from Germany visiting Chiang Mai to do a Vipassana retreat. I would love to stay with someone who shares an interest in mindfulness. 4 nights in March?',
    status: 'accepted',
    convo: [
      { from: 'guest', text: 'Sawadee ka Nattaya! I am a yoga teacher from Germany visiting Chiang Mai to do a Vipassana retreat. I would love to stay with someone who shares an interest in mindfulness. 4 nights in March?' },
      { from: 'host',  text: 'Sawadee ka! A yoga teacher — how wonderful. My home is a quiet, mindful space. I hold a morning practice every day at 6am — please join if you like. Confirmed for March.' },
      { from: 'guest', text: 'Joining your practice would be perfect. I will bring herbal teas from my garden at home as a gift.' },
      { from: 'host',  text: 'How lovely! I will prepare the meditation cushions. See you in March 🙏' },
    ],
  },
  {
    msg: 'Hello Priya! I am planning a Himalayan trekking trip and want to spend a few days in Mumbai first to acclimatise to India. Your home sounds wonderful — 3 nights from November 8?',
    status: 'pending',
    convo: [
      { from: 'guest', text: 'Hello Priya! I am planning a Himalayan trekking trip and want to spend a few days in Mumbai first to acclimatise to India. Your home sounds wonderful — 3 nights from November 8?' },
      { from: 'host',  text: 'Welcome to Mumbai! I do have space. I am currently finalising my November calendar — can I confirm by Thursday? I will also send you my trekking kit checklist — I have done Annapurna four times!' },
    ],
  },
]

// ── Main Seed Function ─────────────────────────────────────────────────────────
async function seed() {
  await mongoose.connect(MONGODB_URI)
  console.log('✅ Connected to MongoDB')

  // Clean existing seed data
  const seedEmailRegex = new RegExp(SEED_DOMAIN.replace('.', '\\.') + '$')
  const existingSeeds = await User.find({ email: seedEmailRegex }).select('_id').lean()
  const seedIds = existingSeeds.map(u => u._id)

  if (seedIds.length > 0 || CLEAN) {
    console.log(`🧹 Removing ${seedIds.length} existing seed users and related data...`)
    await Promise.all([
      User.deleteMany({ email: seedEmailRegex }),
      HostProfile.deleteMany({ userId: { $in: seedIds } }),
      HostingRequest.deleteMany({ $or: [{ guestId: { $in: seedIds } }, { hostId: { $in: seedIds } }] }),
      Message.deleteMany({}),  // simplified: clean all messages since requestIds are gone
      BlogPost.deleteMany({ authorId: { $in: seedIds } }),
      CommunityPost.deleteMany({ authorId: { $in: seedIds } }),
      CommunityComment.deleteMany({ authorId: { $in: seedIds } }),
    ])
    console.log('✅ Cleaned existing seed data')
  }

  if (CLEAN) {
    console.log('🧹 --clean flag: data removed, exiting.')
    await mongoose.disconnect()
    return
  }

  // Hash password once
  const password = await bcrypt.hash('SisterRoam@2024', 12)

  // Build all user objects
  const hostUsers   = await buildUsers(hostsRaw, 'host', password)
  const guestUsers  = await buildUsers(guestsRaw, 'guest', password)
  const bothUsers   = await buildUsers(bothRaw, 'both', password)
  const allUsers    = [...hostUsers, ...guestUsers, ...bothUsers]

  // Insert users
  await User.insertMany(allUsers)
  console.log(`✅ Inserted ${allUsers.length} users (10 host, 20 guest, 20 both)`)

  // Build host profiles (hosts + both = indices 0–9 + 30–49)
  const hostAndBothUsers = [...hostUsers, ...bothUsers]
  const hostProfiles = hostProfileDefs.map((def, i) => ({
    _id: oid(),
    userId: hostAndBothUsers[i]._id,
    accommodationType: def.accType,
    maxGuests: def.max,
    freeOfferings: def.offerings,
    houseRules: def.rules,
    languagesForGuests: hostAndBothUsers[i].languages,
    femaleOnly: def.femOnly,
    isAcceptingGuests: true,
    isListingActive: true,
    responseRate: def.respRate,
    responseTimeHours: def.respTime,
    totalStays: def.stays,
    addressCity: def.city,
    addressCountry: def.country,
    addressVerified: i < 10,
    paidServices: i % 3 === 0 ? [
      { name: 'City Tour', description: 'Half-day guided neighbourhood walk', price: 15, currency: 'USD', duration: '3 hours' }
    ] : [],
  }))

  await HostProfile.insertMany(hostProfiles)
  console.log(`✅ Inserted ${hostProfiles.length} host profiles`)

  // Build hosting requests + messages
  const allHostsAndBoth = [...hostUsers, ...bothUsers]
  const allGuestsAndBoth = [...guestUsers, ...bothUsers]

  const requestDates = [
    { checkIn: daysAgo(30),  checkOut: daysAgo(27) },
    { checkIn: daysAgo(60),  checkOut: daysAgo(56) },
    { checkIn: daysFromNow(10), checkOut: daysFromNow(14) },
    { checkIn: daysAgo(5),   checkOut: daysAgo(2)  },
    { checkIn: daysAgo(90),  checkOut: daysAgo(85) },
    { checkIn: daysAgo(15),  checkOut: daysAgo(10) },
    { checkIn: daysAgo(45),  checkOut: daysAgo(43) },
    { checkIn: daysAgo(20),  checkOut: daysAgo(15) },
    { checkIn: daysAgo(7),   checkOut: daysAgo(3)  },
    { checkIn: daysFromNow(20), checkOut: daysFromNow(23) },
  ]

  const requests = []
  const messages = []

  for (let i = 0; i < conversationTemplates.length; i++) {
    const tmpl = conversationTemplates[i]
    const guest = allGuestsAndBoth[i % allGuestsAndBoth.length]
    const host  = allHostsAndBoth[i % allHostsAndBoth.length]
    const dates = requestDates[i]
    const nights = Math.round((dates.checkOut - dates.checkIn) / 86_400_000)
    const lastMsg = tmpl.convo[tmpl.convo.length - 1]
    const reqId = oid()

    requests.push({
      _id: reqId,
      guestId: guest._id,
      hostId: host._id,
      checkInDate: dates.checkIn,
      checkOutDate: dates.checkOut,
      nights,
      message: tmpl.msg,
      status: tmpl.status,
      safetyAcknowledged: true,
      lastMessageAt: daysAgo(i),
      lastMessagePreview: lastMsg.text.slice(0, 80),
    })

    let msgTime = new Date(dates.checkIn.getTime() - 7 * 86_400_000)
    for (const m of tmpl.convo) {
      messages.push({
        _id: oid(),
        requestId: reqId,
        senderId: m.from === 'guest' ? guest._id : host._id,
        content: m.text,
        isRead: true,
        readAt: new Date(msgTime.getTime() + 3600000),
        messageType: 'text',
        createdAt: new Date(msgTime),
      })
      msgTime = new Date(msgTime.getTime() + 3 * 3600000)
    }
  }

  await HostingRequest.insertMany(requests)
  await Message.insertMany(messages)
  console.log(`✅ Inserted ${requests.length} hosting requests with ${messages.length} messages`)

  // Build blog posts
  const verifiedHosts = [...hostUsers, ...bothUsers].filter(u => u.verificationTier !== 'basic')
  const blogPosts = blogDefs.map((def, i) => {
    const author = verifiedHosts[i % verifiedHosts.length]
    const slug = slugify(def.title) + '-' + (Date.now() + i)
    return {
      _id: oid(),
      authorId: author._id,
      title: def.title,
      slug,
      excerpt: def.excerpt,
      content: def.content,
      coverImageUrl: `https://images.unsplash.com/photo-${1500000000000 + i * 10000000}?w=800`,
      category: def.cat,
      tags: def.tags,
      isPublished: true,
      viewsCount: def.views,
      likesCount: def.likes,
      readTimeMinutes: def.readTime,
      publishedAt: daysAgo(30 - i * 4),
    }
  })

  await BlogPost.insertMany(blogPosts)
  console.log(`✅ Inserted ${blogPosts.length} blog posts`)

  // Build community posts + comments
  const allActiveUsers = allUsers.filter(u => u.isActive)
  const commPosts = communityPostDefs.map((def, i) => {
    const author = allActiveUsers[i * 3 % allActiveUsers.length]
    const likerCount = Math.floor(Math.random() * 20) + 2
    const likers = randN(allActiveUsers, likerCount).map(u => u._id)
    return {
      _id: oid(),
      authorId: author._id,
      content: def.text,
      category: def.cat,
      likes: likers,
      likesCount: likers.length,
      commentsCount: 2,
      isPublished: true,
    }
  })

  await CommunityPost.insertMany(commPosts)

  const commentTexts = [
    'This is exactly what I needed to read. Thank you so much for sharing! 🙏',
    'Completely agree with this. Saved this post to share with my solo travel group.',
    'I had the same experience! The community here is truly special.',
    'Adding this to my pre-trip checklist right now. Great tip!',
    'Can I DM you for more details? This matches my trip perfectly.',
    'Beautifully written. This resonates so deeply.',
    'Yes! This is the kind of real advice that actually helps.',
    'Thank you for being so open and honest about this.',
    'Pinning this post. Pure gold for first-time solo travellers.',
    'The community here is everything. So grateful for SisterRoam.',
  ]

  const comments = []
  for (let i = 0; i < commPosts.length; i++) {
    const post = commPosts[i]
    for (let j = 0; j < 2; j++) {
      const commenter = allActiveUsers[(i * 7 + j * 3 + 1) % allActiveUsers.length]
      comments.push({
        _id: oid(),
        postId: post._id,
        authorId: commenter._id,
        content: commentTexts[(i * 2 + j) % commentTexts.length],
      })
    }
  }

  await CommunityComment.insertMany(comments)
  console.log(`✅ Inserted ${commPosts.length} community posts with ${comments.length} comments`)

  // Summary
  console.log('\n🎉 Seed complete!')
  console.log('─────────────────────────────────────────')
  console.log(`  Users:             ${allUsers.length} (10 host · 20 guest · 20 both)`)
  console.log(`  Host Profiles:     ${hostProfiles.length}`)
  console.log(`  Hosting Requests:  ${requests.length}`)
  console.log(`  Messages:          ${messages.length}`)
  console.log(`  Blog Posts:        ${blogPosts.length}`)
  console.log(`  Community Posts:   ${commPosts.length}`)
  console.log(`  Comments:          ${comments.length}`)
  console.log('─────────────────────────────────────────')
  console.log('  Test credentials:  <username>@sisterroam-seed.dev / SisterRoam@2024')
  console.log('  Remove all seeds:  node scripts/seed.mjs --clean')

  await mongoose.disconnect()
}

seed().catch(err => {
  console.error('❌ Seed failed:', err.message)
  console.error(err.stack)
  process.exit(1)
})
