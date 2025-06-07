import { Metadata } from "next";
import FavoritesClient from "./FavoritesClient";

export const metadata: Metadata = {
  title: "My Favourites | OmaHub",
  description: "Your saved favourite fashion brands and designers",
};

export default function FavoritesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-canela mb-8 text-oma-plum">My Favourites</h1>
      <FavoritesClient />
    </main>
  );
}
