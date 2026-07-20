import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type AgendaEntry = {
  date: string;
  startTime: string;
  endTime: string;
  title: string;
  location: string;
  companion?: string;
};

const agenda: AgendaEntry[] = [
  {
    date: "2026-07-21",
    startTime: "08:00",
    endTime: "10:00",
    title: "Kajian bersama Santri SMP Pesantren Peradaban Dunia JAGAT ’ARSY",
    location: "Pesantren Peradaban Dunia JAGAT ’ARSY",
  },
  {
    date: "2026-07-22",
    startTime: "19:30",
    endTime: "21:30",
    title: "Kajian bersama Santri SMA Pesantren Peradaban Dunia JAGAT ’ARSY",
    location: "Pesantren Peradaban Dunia JAGAT ’ARSY",
  },
  {
    date: "2026-07-24",
    startTime: "19:30",
    endTime: "21:30",
    title: "Manaqib Tuan Syeikh di Roudhoh Shufiyyah Al-Fatih, Bekasi",
    location: "Roudhoh Shufiyyah Al-Fatih, Bekasi",
    companion: "Santri",
  },
  {
    date: "2026-07-26",
    startTime: "08:00",
    endTime: "10:00",
    title: "Manaqib Tuan Syeikh di Roudhoh Shufiyyah Keraton Kasepuhan",
    location: "Masjid Agung Sang Cipta Rasa, Keraton Kasepuhan, Cirebon",
    companion: "Izul",
  },
  {
    date: "2026-07-26",
    startTime: "16:00",
    endTime: "18:00",
    title: "Manaqib Tuan Syeikh di Roudhoh Shufiyyah Al-Ikhlas",
    location: "Roudhoh Shufiyyah Al-Ikhlas, Indramayu",
    companion: "Izul",
  },
  {
    date: "2026-07-27",
    startTime: "19:30",
    endTime: "21:30",
    title: "Manaqib Tuan Syeikh di Roudhoh Shufiyyah Islamic Center Kabupaten Kuningan",
    location: "Masjid Islamic Center Kabupaten Kuningan",
    companion: "Izul",
  },
  {
    date: "2026-07-28",
    startTime: "08:00",
    endTime: "10:00",
    title: "Manaqib Tuan Syeikh di Roudhoh Shufiyyah Masjid Sang Sirnarasa",
    location: "Masjid Sang Sirnarasa, Ciamis",
    companion: "Izul",
  },
  {
    date: "2026-07-29",
    startTime: "08:00",
    endTime: "10:00",
    title: "Manaqib Tuan Syeikh di Roudhoh Shufiyyah Pesantren Sirnarasa",
    location: "Pesantren Sirnarasa, Ciamis",
    companion: "Izul",
  },
  {
    date: "2026-07-30",
    startTime: "08:00",
    endTime: "10:00",
    title: "Manaqib Tuan Syeikh di Roudhoh Shufiyyah Al-Jadiidatutsaniyah",
    location: "Roudhoh Shufiyyah Al-Jadiidatutsaniyah, Tasikmalaya",
    companion: "Izul",
  },
  {
    date: "2026-07-31",
    startTime: "19:30",
    endTime: "21:30",
    title: "Manaqib Tuan Syeikh di Roudhoh Shufiyyah Jundun Hudaya",
    location: "Roudhoh Shufiyyah Jundun Hudaya, Kuningan",
  },
];

function toUtcFromWib(date: string, time: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  return new Date(Date.UTC(year, month - 1, day, hours - 7, minutes));
}

function normalizeTitle(value: string) {
  return value
    .split("\n", 1)[0]
    .normalize("NFKC")
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, " ")
    .trim()
    .toLocaleLowerCase("id-ID");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const existingAgenda = await prisma.quickPost.findMany({
    where: {
      type: "AGENDA",
      startsAt: {
        gte: new Date("2026-07-20T17:00:00.000Z"),
        lt: new Date("2026-08-01T17:00:00.000Z"),
      },
    },
    orderBy: { startsAt: "asc" },
  });

  let created = 0;
  let updated = 0;

  for (const entry of agenda) {
    const startsAt = toUtcFromWib(entry.date, entry.startTime);
    const endsAt = toUtcFromWib(entry.date, entry.endTime);
    const content = entry.companion
      ? `${entry.title}\nPendamping kegiatan: ${entry.companion}`
      : entry.title;
    const existing = existingAgenda.find(
      (post) => normalizeTitle(post.content) === normalizeTitle(entry.title),
    );

    if (dryRun) {
      console.log(`${existing ? "UPDATE" : "CREATE"} ${entry.date} ${entry.startTime} WIB — ${entry.title}`);
      continue;
    }

    const data = {
      type: "AGENDA",
      content,
      imageUrl: null,
      sourcePostId: null,
      sourceTitle: null,
      sourceSlug: null,
      startsAt,
      endsAt,
      locationLabel: entry.location,
      locationLatitude: null,
      locationLongitude: null,
      status: "Published",
    };

    if (existing) {
      await prisma.quickPost.update({ where: { id: existing.id }, data });
      updated += 1;
    } else {
      await prisma.quickPost.create({ data });
      created += 1;
    }
  }

  if (dryRun) {
    console.log(`Dry run selesai: ${agenda.length} agenda diperiksa, tanpa perubahan database.`);
    return;
  }

  console.log(`Upload selesai: ${created} dibuat, ${updated} diperbarui.`);
}

main()
  .catch((error) => {
    console.error("Upload agenda Juli 2026 gagal.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
