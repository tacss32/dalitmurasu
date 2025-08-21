export default function Header() {
  return (
    <div className={`bg-[url(/about.svg)] bg-cover bg-no-repeat bg-center`}>
      <div className="bg-black/50 text-white h-96 w-full flex flex-col justify-center items-center">
        <h1 className="text-3xl font-bold">Lets get closer.</h1>
        <p className="text-lg font-semibold">
          We receive result combining marketing, a creative and industry
          experience.
        </p>
      </div>
    </div>
  );
}
