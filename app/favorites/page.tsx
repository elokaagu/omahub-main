import { Metadata } from "next";
import FavoritesClient from "./FavoritesClient";

export const metadata: Metadata = {
  title: "My Favorites | OmaHub",
  description: "Your saved favorite fashion brands and designers",
};

export default function FavoritesPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-canela mb-8 text-oma-plum">My Favorites</h1>
      <FavoritesClient />
    </main>
  );
}
