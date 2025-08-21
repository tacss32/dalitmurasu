import profile from "/profile.jpg";

const teamMembers = [
  {
    name: "John Doe",
    role: "Founder & CEO",
    image: profile,
    socialLinks: {
      twitter: "https://twitter.com/johndoe",
      linkedin: "https://linkedin.com/in/johndoe",
      github: "https://github.com/johndoe",
    },
  },
  {
    name: "Jane Smith",
    role: "Editor-in-Chief",
    image: profile,
    socialLinks: {
      twitter: "https://twitter.com/janesmith",
      linkedin: "https://linkedin.com/in/janesmith",
      github: "https://github.com/janesmith",
    },
  },
  {
    name: "Jane Smith",
    role: "Editor-in-Chief",
    image: profile,
    socialLinks: {
      twitter: "https://twitter.com/janesmith",
      linkedin: "https://linkedin.com/in/janesmith",
      github: "https://github.com/janesmith",
    },
  },
  {
    name: "Jane Smith",
    role: "Editor-in-Chief",
    image: profile,
    socialLinks: {
      twitter: "https://twitter.com/janesmith",
      linkedin: "https://linkedin.com/in/janesmith",
      github: "https://github.com/janesmith",
    },
  },
  // Add more team members as needed
];

export default function OurTeam() {
  return (
    <section className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Our Team</h1>
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {teamMembers.map((member, index) => (
          <div
            key={index}
            className="bg-no-repeat bg-center bg-cover h-60 w-48 dark:bg-gray-800 rounded-lg shadow-lg"
            style={{
              backgroundImage: `url(${member.image})`,
            }}
          >
            <div className="h-full w-full p-3 flex flex-col justify-end text-center text-white">
              <h2 className="text-xl font-semibold">{member.name}</h2>
              <p>{member.role}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
