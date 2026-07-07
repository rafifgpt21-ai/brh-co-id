import coverUrls from "./material-book-cover-urls.json";

type FeaturedBookText = Record<"id" | "en", string>;

const coverMapping = coverUrls as Record<string, string>;
const getCoverUrl = (slug: string) => coverMapping[slug] || `/api/book-cover/${slug}`;

export interface FeaturedBookQuote {
  text: FeaturedBookText;
  author: string;
}

export interface FeaturedBook {
  year: string;
  slug: string;
  slugEn: string;
  title: FeaturedBookText;
  subtitle?: FeaturedBookText;
  author: string;
  cover: string;
  category: FeaturedBookText;
  publisher?: string;
  preface?: FeaturedBookText;
  prolog?: FeaturedBookText;
  summary: FeaturedBookText;
  highlights: Record<"id" | "en", string[]>;
  audience: Record<"id" | "en", string[]>;
  quotes: FeaturedBookQuote[];
  referenceLink: {
    url: string;
    title: FeaturedBookText;
    caption: FeaturedBookText;
  };
}

export const featuredBooks: FeaturedBook[] = [
  {
    year: "2025",
    slug: "selayang-pandang-sejarah-tasawuf-tarekat-sufi",
    slugEn: "an-overview-of-the-history-of-sufism-and-sufi-orders",
    title: {
      id: "Selayang Pandang Sejarah Tasawuf & Tarekat Sufi",
      en: "An Overview of the History of Sufism and Sufi Orders",
    },
    author: "Budi Rahman Hakim, S.Ag., M.S.W., Ph.D",
    cover: getCoverUrl("selayang-pandang-tasawuf-tarekat-sufi"),
    category: {
      id: "Agama Islam / Spiritualitas / Sejarah",
      en: "Islamic Studies / Spirituality / History",
    },
    publisher: "RM Books",
    prolog: {
      id: "Prof. Ismail Fajrie Alatas, Professor of Sufism at New York University",
      en: "Prof. Ismail Fajrie Alatas, Professor of Sufism at New York University",
    },
    summary: {
      id: "Buku ini menyajikan perjalanan panjang dimensi batin Islam secara jernih dan sistematis, dari akar spiritual masa Nabi dan Sahabat hingga transformasi tasawuf dalam dunia modern. Dr. Budi Rahman Hakim memetakan bagaimana tazkiyah al-nafs tumbuh menjadi gerakan tarekat dan komunitas spiritual yang memberi dampak sosial nyata.",
      en: "This book presents the long historical journey of Islam's inner dimension, from the spiritual foundations of the Prophet's era and the Companions to the transformation of Sufism in the modern world. Dr. Budi Rahman Hakim maps how tazkiyah al-nafs developed into Sufi orders and spiritual communities with real social impact.",
    },
    highlights: {
      id: [
        "Akar sejarah tasawuf, dari zuhud para sahabat hingga pelembagaan tarekat.",
        "Konsep sentral seperti ma'rifah, tazkiyah, dan dzikir.",
        "Debat klasik dan kontemporer tentang orisinalitas tasawuf dalam Islam.",
        "Peran tarekat dalam membentuk etika sosial dan perubahan masyarakat.",
      ],
      en: [
        "The roots of Sufism, from early ascetic practice to organized Sufi orders.",
        "Central concepts such as ma'rifah, tazkiyah, and dhikr.",
        "Classical and contemporary debates on the originality of Sufism in Islam.",
        "The role of Sufi orders in shaping public ethics and social transformation.",
      ],
    },
    audience: {
      id: [
        "Mahasiswa dan pengajar studi Islam, tasawuf, dan sejarah peradaban.",
        "Peneliti neosufisme dan dinamika tarekat kontemporer.",
        "Pembaca umum yang ingin memahami esensi batin Islam.",
      ],
      en: [
        "Students and lecturers of Islamic studies, Sufism, and civilizational history.",
        "Researchers of Neo-Sufism and contemporary Sufi orders.",
        "General readers seeking to understand the inner dimension of Islam.",
      ],
    },
    quotes: [
      {
        text: {
          id: "Tasawuf adalah bagian dari ajaran Islam sejak awalnya.",
          en: "Sufism has been part of Islamic teaching from its beginning.",
        },
        author: "Ibn Khaldun, Muqaddimah",
      },
      {
        text: {
          id: "Tazkiyah al-nafs adalah metode utama dalam penyempurnaan akhlak.",
          en: "Tazkiyah al-nafs is a primary method for perfecting character.",
        },
        author: "al-Dihlawi, Hujjatullah al-Balighah",
      },
    ],
    referenceLink: {
      url: "https://scholar.google.com/scholar?q=Selayang+Pandang+Tasawuf+Tarekat+Sufi+Budi+Rahman+Hakim",
      title: {
        id: "DOI / Link Referensi Buku",
        en: "DOI / Book Reference Link",
      },
      caption: {
        id: "DOI buku belum tercantum di dokumen sumber; tautan ini mengarah ke rekam bibliografis/penelusuran judul.",
        en: "The book DOI is not listed in the source document; this link points to a bibliographic record/title lookup.",
      },
    },
  },
  {
    year: "2025",
    slug: "akhlaq-tasawuf",
    slugEn: "sufi-ethics",
    title: {
      id: "Akhlaq Tasawuf",
      en: "Sufi Ethics",
    },
    subtitle: {
      id: "Pendidikan Karakter Berbasis Kurikulum Tarekat Sufi",
      en: "Character Education Based on the Curriculum of Sufi Orders",
    },
    author: "Budi Rahman Hakim, S.Ag., M.S.W., Ph.D.",
    cover: getCoverUrl("akhlaq-tasawuf"),
    category: {
      id: "Agama Islam / Pendidikan / Spiritualitas",
      en: "Islamic Studies / Education / Spirituality",
    },
    publisher: "RM Books",
    summary: {
      id: "Buku ini menawarkan paradigma pendidikan karakter yang melihat akhlak bukan sekadar aturan perilaku, melainkan buah dari penyucian jiwa dan penyelarasan diri dengan cahaya Ilahi. Melalui dzikir, adab, dan bimbingan ruhani, karya ini menjembatani khazanah tasawuf klasik dengan kebutuhan pendidikan kontemporer.",
      en: "This book offers a character education paradigm in which ethics are not merely rules of behavior, but the fruit of inner purification and alignment with divine light. Through dhikr, adab, and spiritual guidance, it connects classical Sufi wisdom with contemporary educational needs.",
    },
    highlights: {
      id: [
        "Akhlaq sebagai buah dari tazkiyatun nafs dan latihan ruhani.",
        "Peran dzikir, adab, dan pembimbingan spiritual dalam membentuk insan kamil.",
        "Keikhlasan, kesabaran, mahabbah, khidmah, dan muhasabah sebagai pilar karakter.",
        "Kurikulum spiritual tarekat sebagai pendekatan pendidikan karakter.",
      ],
      en: [
        "Ethics as the fruit of tazkiyatun nafs and spiritual discipline.",
        "Dhikr, adab, and spiritual mentorship as foundations of human formation.",
        "Sincerity, patience, divine love, service, and self-examination as pillars of character.",
        "The Sufi order curriculum as a model for character education.",
      ],
    },
    audience: {
      id: [
        "Pendidik dan praktisi pendidikan karakter.",
        "Pembimbing spiritual dan pengasuh pesantren.",
        "Mahasiswa, akademisi, dan pembaca umum yang menekuni akhlak sufistik.",
      ],
      en: [
        "Educators and practitioners of character education.",
        "Spiritual mentors and pesantren caregivers.",
        "Students, academics, and general readers interested in Sufi ethics.",
      ],
    },
    quotes: [
      {
        text: {
          id: "Akhlaq adalah buah dari ilmu dan dzikir.",
          en: "Character is the fruit of knowledge and remembrance.",
        },
        author: "Syekh Nawawi al-Bantani",
      },
      {
        text: {
          id: "Sulit bagi murid untuk sampai kepada Allah kecuali dengan akhlaq yang mulia.",
          en: "A disciple reaches God through noble character.",
        },
        author: "Syekh Ahmad Khatib Sambas",
      },
    ],
    referenceLink: {
      url: "https://scholar.google.com/scholar?q=Akhlak+Tasawuf+Pendidikan+Karakter+Berbasis+Tarekat+Sufi+Budi+Rahman+Hakim",
      title: {
        id: "DOI / Link Referensi Buku",
        en: "DOI / Book Reference Link",
      },
      caption: {
        id: "DOI buku belum tercantum di dokumen sumber; tautan ini mengarah ke rekam bibliografis/penelusuran judul.",
        en: "The book DOI is not listed in the source document; this link points to a bibliographic record/title lookup.",
      },
    },
  },
  {
    year: "2025",
    slug: "pengantar-ilmu-tasawuf",
    slugEn: "introduction-to-sufism",
    title: {
      id: "Pengantar Ilmu Tasawuf",
      en: "Introduction to Sufism",
    },
    subtitle: {
      id: "Fondasi Konseptual, Kerangka Filsafat dan Relevansi Zaman",
      en: "Conceptual Foundations, Philosophical Frameworks, and Contemporary Relevance",
    },
    author: "Budi Rahman Hakim, S.Ag., M.S.W., Ph.D.",
    cover: getCoverUrl("pengantar-ilmu-tasawuf"),
    category: {
      id: "Agama Islam / Tasawuf / Filsafat",
      en: "Islamic Studies / Sufism / Philosophy",
    },
    publisher: "RM Books",
    summary: {
      id: "Buku ini mengajak pembaca memahami tasawuf sebagai disiplin ilmu yang kokoh, bukan sekadar wirid atau pelarian spiritual. Dr. Budi Rahman Hakim memadukan fondasi ontologis, epistemologis, dan aksiologis untuk menjelaskan hakikat manusia, struktur wujud ruhani, dan jalan menuju ma'rifah dalam bingkai akal dan adab.",
      en: "This book invites readers to understand Sufism as a rigorous discipline, not merely devotional practice or spiritual escape. Dr. Budi Rahman Hakim brings together ontological, epistemological, and axiological foundations to explain human nature, the structure of spiritual being, and the path toward ma'rifah through reason and adab.",
    },
    highlights: {
      id: [
        "Tasawuf sebagai ilmu dengan fondasi konseptual dan filosofis.",
        "Peta jalan menuju keutuhan diri dan ketenangan batin.",
        "Rujukan kepada al-Ghazali, al-Qusyairi, Ibn Arabi, dan Chittick.",
        "Relevansi tasawuf bagi kesehatan jiwa, akhlak, dan kehidupan modern.",
      ],
      en: [
        "Sufism as a discipline with conceptual and philosophical foundations.",
        "A map toward personal wholeness and inner tranquility.",
        "Engagement with al-Ghazali, al-Qushayri, Ibn Arabi, and Chittick.",
        "The relevance of Sufism for mental well-being, ethics, and modern life.",
      ],
    },
    audience: {
      id: [
        "Mahasiswa dan pendidik yang membutuhkan rujukan sistematis.",
        "Santri yang ingin memperkuat pemahaman spiritual tradisional.",
        "Pencari makna hidup yang ingin merawat jiwa dan akhlak.",
      ],
      en: [
        "Students and educators who need a structured reference.",
        "Santri seeking to strengthen traditional spiritual understanding.",
        "Meaning-seekers interested in caring for the soul and character.",
      ],
    },
    quotes: [
      {
        text: {
          id: "Ilmu Tasawwuf itu adalah jalan membersihkan hati.",
          en: "The science of Sufism is the path of cleansing the heart.",
        },
        author: "Syekh Nuruddin ar-Raniri",
      },
      {
        text: {
          id: "Tasawuf itu jalan menuju makrifat.",
          en: "Sufism is the path toward ma'rifah.",
        },
        author: "Syekh Abdus Shamad al-Palimbani",
      },
    ],
    referenceLink: {
      url: "https://scholar.google.com/scholar?q=Pengantar+Ilmu+Tasawuf+Fondasi+Konseptual+Kerangka+Filsafat+Relevansi+Zaman+Budi+Rahman+Hakim",
      title: {
        id: "DOI / Link Referensi Buku",
        en: "DOI / Book Reference Link",
      },
      caption: {
        id: "DOI buku belum tercantum di dokumen sumber; tautan ini mengarah ke rekam bibliografis/penelusuran judul.",
        en: "The book DOI is not listed in the source document; this link points to a bibliographic record/title lookup.",
      },
    },
  },
  {
    year: "2026",
    slug: "sufinomic",
    slugEn: "sufinomic",
    title: {
      id: "Sufinomic",
      en: "Sufinomic",
    },
    subtitle: {
      id: "Pilar Politik-Ekonomi untuk Indonesia Maju dan Sejahtera",
      en: "Political-Economic Pillars for an Advanced and Prosperous Indonesia",
    },
    author: "Budi Rahman Hakim, Ph.D.",
    cover: getCoverUrl("sufinomic"),
    category: {
      id: "Ekonomi / Politik / Sosial-Keagamaan",
      en: "Economics / Politics / Socio-Religious Thought",
    },
    preface: {
      id: "Airlangga Hartarto, Menteri Koordinator Bidang Perekonomian RI",
      en: "Airlangga Hartarto, Coordinating Minister for Economic Affairs of Indonesia",
    },
    prolog: {
      id: "Prof. Burhanuddin Muhtadi, Ph.D.",
      en: "Prof. Burhanuddin Muhtadi, Ph.D.",
    },
    summary: {
      id: "Sufinomic menawarkan gagasan pembangunan bangsa yang modern dan beradab dengan fondasi spiritualitas. Buku ini menegaskan bahwa kegagalan pembangunan tidak hanya bersifat politik atau ekonomi, tetapi juga spiritual ketika moralitas dikesampingkan dan manusia direduksi menjadi alat produksi serta konsumsi.",
      en: "Sufinomic proposes a vision of national development that is modern, ethical, and spiritually grounded. The book argues that development failure is not only political or economic, but also spiritual when morality is neglected and human beings are reduced to instruments of production and consumption.",
    },
    highlights: {
      id: [
        "Pembangunan berbasis spiritualitas dan etika publik.",
        "Kritik terhadap reduksi manusia dalam logika produksi-konsumsi.",
        "Keselarasan rasionalitas ekonomi-politik dengan kejernihan moral.",
        "Tanggung jawab kolektif untuk Indonesia yang maju dan sejahtera.",
      ],
      en: [
        "Development rooted in spirituality and public ethics.",
        "A critique of reducing human beings to production and consumption.",
        "Alignment between political-economic rationality and moral clarity.",
        "Collective responsibility for an advanced and prosperous Indonesia.",
      ],
    },
    audience: {
      id: [
        "Pengambil kebijakan dan pemerhati pembangunan nasional.",
        "Akademisi ekonomi-politik dan sosial-keagamaan.",
        "Masyarakat luas yang mencari model kemajuan yang beradab.",
      ],
      en: [
        "Policy makers and observers of national development.",
        "Scholars of political economy and socio-religious thought.",
        "General readers seeking an ethical model of progress.",
      ],
    },
    quotes: [],
    referenceLink: {
      url: "https://scholar.google.com/scholar?q=SUFINOMIC+Pilar+Politik+Ekonomi+untuk+Indonesia+Maju+dan+Sejahtera+Budi+Rahman+Hakim",
      title: {
        id: "DOI / Link Referensi Buku",
        en: "DOI / Book Reference Link",
      },
      caption: {
        id: "DOI buku belum tercantum di dokumen sumber; tautan ini mengarah ke rekam bibliografis/penelusuran judul.",
        en: "The book DOI is not listed in the source document; this link points to a bibliographic record/title lookup.",
      },
    },
  },
  {
    year: "2025",
    slug: "actualization-of-neo-sufism",
    slugEn: "actualization-of-neo-sufism",
    title: {
      id: "Actualization of Neo-Sufism",
      en: "Actualization of Neo-Sufism",
    },
    subtitle: {
      id: "A Case Study of The Tariqa Qadiriyya Naqshabandiyya Pondok Pesantren Suryalaya",
      en: "A Case Study of The Tariqa Qadiriyya Naqshabandiyya Pondok Pesantren Suryalaya",
    },
    author: "Budi Rahman Hakim, MSW, Ph.D.",
    cover: getCoverUrl("actualization-of-neo-sufism"),
    category: {
      id: "Studi Islam / Sosiologi Agama / Tasawuf & Tarekat",
      en: "Islamic Studies / Sociology of Religion / Sufism and Sufi Orders",
    },
    summary: {
      id: "Buku akademik berbahasa Inggris ini mengkaji bagaimana Tarekat Qadiriyya Naqshabandiyya Pondok Pesantren Suryalaya bertahan, relevan, dan berkembang dalam modernitas. Berdasarkan rentang kajian 1980-2020, buku ini menunjukkan Neo-Sufisme sebagai kekuatan aktif yang menghubungkan kesalehan spiritual dengan keterlibatan sosial, ekonomi, dan politik.",
      en: "This English-language academic book examines how the Tariqa Qadiriyya Naqshabandiyya of Pondok Pesantren Suryalaya has remained resilient, relevant, and dynamic in modernity. Covering 1980-2020, it shows Neo-Sufism as an active force linking spiritual piety with social, economic, and political engagement.",
    },
    highlights: {
      id: [
        "Evolusi Neo-Sufisme dari tradisi spiritual menuju gerakan modern yang dinamis.",
        "Keterlibatan multidimensi pengikut tarekat dalam kehidupan sosial-ekonomi.",
        "Studi kasus TQN Suryalaya dalam rentang 1980-2020.",
        "Strategi tarekat menghadapi era disrupsi dan krisis eksistensial modern.",
      ],
      en: [
        "The evolution of Neo-Sufism from spiritual tradition to dynamic modern movement.",
        "Multidimensional engagement of Sufi followers in social and economic life.",
        "A case study of TQN Suryalaya across 1980-2020.",
        "Strategies of Sufi orders in facing disruption and modern existential crisis.",
      ],
    },
    audience: {
      id: [
        "Peneliti internasional dan Indonesianis.",
        "Dosen serta mahasiswa pascasarjana studi agama dan antropologi Islam.",
        "Pembaca akademis yang meneliti hubungan tradisi spiritual dan modernitas.",
      ],
      en: [
        "International researchers and Indonesianists.",
        "Lecturers and graduate students in religious studies and Islamic anthropology.",
        "Academic readers studying the relationship between spiritual tradition and modernity.",
      ],
    },
    quotes: [
      {
        text: {
          id: "Sebuah potret ordo sufi yang bekerja efektif di tengah dunia yang disruptif.",
          en: "A portrait of a Sufi order working effectively in a disruptive world.",
        },
        author: "Prof. Dr. Azyumardi Azra, CBE",
      },
      {
        text: {
          id: "Perspektif analisis baru tentang rekam jejak TQN dalam Indonesia modern.",
          en: "A fresh analytical perspective on TQN's record in modern Indonesia.",
        },
        author: "Dr. Oman Fathurahman",
      },
    ],
    referenceLink: {
      url: "https://scholar.google.com/scholar?q=Actualization+of+Neo-Sufism+A+Case+Study+of+The+Tariqa+Qadiriyya+Naqshabandiyya+Pondok+Pesantren+Suryalaya+Budi+Rahman+Hakim",
      title: {
        id: "DOI / Link Referensi Buku",
        en: "DOI / Book Reference Link",
      },
      caption: {
        id: "DOI buku belum tercantum di dokumen sumber; tautan ini mengarah ke rekam bibliografis/penelusuran judul.",
        en: "The book DOI is not listed in the source document; this link points to a bibliographic record/title lookup.",
      },
    },
  },
  {
    year: "2026",
    slug: "resurgensi-islam-sufi",
    slugEn: "the-resurgence-of-sufi-islam",
    title: {
      id: "Resurgensi Islam Sufi",
      en: "The Resurgence of Sufi Islam",
    },
    subtitle: {
      id: "Spiritualitas, Modernitas, dan Masa Depan Peradaban",
      en: "Spirituality, Modernity, and the Future of Civilization",
    },
    author: "Budi Rahman Hakim, Ph.D.",
    cover: getCoverUrl("resurgensi-islam-sufi"),
    category: {
      id: "Agama Islam / Sosiologi Peradaban / Spiritualitas",
      en: "Islamic Studies / Sociology of Civilization / Spirituality",
    },
    preface: {
      id: "Prof. Asep Saepudin Jahar, M.A., Ph.D., Rektor UIN Syarif Hidayatullah Jakarta",
      en: "Prof. Asep Saepudin Jahar, M.A., Ph.D., Rector of UIN Syarif Hidayatullah Jakarta",
    },
    prolog: {
      id: "Prof. Herman Leonard Beck, Ph.D.",
      en: "Prof. Herman Leonard Beck, Ph.D.",
    },
    summary: {
      id: "Buku ini membaca kebangkitan kembali Islam Sufi sebagai jawaban atas krisis eksistensial modern, fragmentasi sosial, dan disrupsi digital. Dr. Budi Rahman Hakim menunjukkan tasawuf sebagai jalan hidup yang membentuk etika sosial, memperkuat karakter, dan menumbuhkan kesadaran sejati bagi masa depan peradaban.",
      en: "This book reads the resurgence of Sufi Islam as a response to modern existential crisis, social fragmentation, and digital disruption. Dr. Budi Rahman Hakim presents Sufism as a way of life that shapes social ethics, strengthens character, and cultivates true awareness for the future of civilization.",
    },
    highlights: {
      id: [
        "Sufisme sebagai penawar kehampaan jiwa dan hilangnya empati di era digital.",
        "Dari majelis dzikir menuju etika sosial dan khidmah.",
        "Transformasi karakter sebagai modal masa depan peradaban.",
        "Keseimbangan antara pencapaian duniawi dan ketenangan ukhrawi.",
      ],
      en: [
        "Sufism as a remedy for spiritual emptiness and fading empathy in the digital age.",
        "From dhikr gatherings to social ethics and service.",
        "Character transformation as a foundation for civilization's future.",
        "Balance between worldly achievement and spiritual tranquility.",
      ],
    },
    audience: {
      id: [
        "Akademisi, dosen, dan mahasiswa studi agama dan peradaban.",
        "Pecinta dunia sufi dan salik yang mencari relevansi laku spiritual.",
        "Masyarakat umum yang mencari ketenangan batin dan kesadaran sosial.",
      ],
      en: [
        "Academics, lecturers, and students of religion and civilization.",
        "Sufi readers and seekers exploring the relevance of spiritual practice.",
        "General readers seeking inner calm and social awareness.",
      ],
    },
    quotes: [],
    referenceLink: {
      url: "https://scholar.google.com/scholar?q=Resurgensi+Islam+Sufi+Spiritualitas+Modernitas+dan+Masa+Depan+Peradaban+Budi+Rahman+Hakim",
      title: {
        id: "DOI / Link Referensi Buku",
        en: "DOI / Book Reference Link",
      },
      caption: {
        id: "DOI buku belum tercantum di dokumen sumber; tautan ini mengarah ke rekam bibliografis/penelusuran judul.",
        en: "The book DOI is not listed in the source document; this link points to a bibliographic record/title lookup.",
      },
    },
  },
];

