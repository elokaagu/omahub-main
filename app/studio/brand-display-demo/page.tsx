"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CompactBrandDisplay,
  HorizontalBrandList,
  BrandChips,
} from "@/components/ui/compact-brand-display";

// Sample data for demonstration
const sampleUsers = [
  {
    id: "1",
    email: "admin@omahub.com",
    role: "super_admin",
    brands: ["All Brands"],
  },
  {
    id: "2",
    email: "brand1@omahub.com",
    role: "brand_admin",
    brands: [
      "Elegant Couture",
      "Modern Fashion",
      "Luxury Wear",
      "Casual Chic",
      "Evening Glam",
    ],
  },
  {
    id: "3",
    email: "brand2@omahub.com",
    role: "brand_admin",
    brands: ["Summer Collection", "Winter Essentials"],
  },
  {
    id: "4",
    email: "user@omahub.com",
    role: "user",
    brands: [],
  },
];

export default function BrandDisplayDemoPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-omahub-primary mb-2">
          Brand Display Options
        </h1>
        <p className="text-lg text-omahub-secondary">
          Choose the best way to display brand assignments in the users table
        </p>
      </div>

      {/* Option 1: Compact Brand Display (Recommended) */}
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800 flex items-center gap-2">
            🎯 Option 1: Compact Brand Display (Recommended)
          </CardTitle>
          <p className="text-green-700">
            Shows first 2 brands + count indicator for additional brands. Clean
            and space-efficient.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {sampleUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-3 bg-white rounded-lg border"
            >
              <div className="w-48 text-sm font-medium">{user.email}</div>
              <div className="w-32">
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                  {user.role.replace("_", " ")}
                </span>
              </div>
              <div className="flex-1">
                {user.role === "super_admin" ? (
                  <span className="text-sm text-gray-600 italic">
                    All brands access
                  </span>
                ) : (
                  <CompactBrandDisplay
                    brands={user.brands}
                    maxVisible={2}
                    className="max-w-xs"
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Option 2: Horizontal Brand List */}
      <Card className="border-2 border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            📋 Option 2: Horizontal Brand List
          </CardTitle>
          <p className="text-blue-700">
            Shows all brands in a horizontal list with separators. Good for few
            brands.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {sampleUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-3 bg-white rounded-lg border"
            >
              <div className="w-48 text-sm font-medium">{user.email}</div>
              <div className="w-32">
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                  {user.role.replace("_", " ")}
                </span>
              </div>
              <div className="flex-1">
                {user.role === "super_admin" ? (
                  <span className="text-sm text-gray-600 italic">
                    All brands access
                  </span>
                ) : (
                  <HorizontalBrandList
                    brands={user.brands}
                    className="max-w-xs"
                  />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Option 3: Brand Chips */}
      <Card className="border-2 border-purple-200 bg-purple-50">
        <CardHeader>
          <CardTitle className="text-purple-800 flex items-center gap-2">
            🎨 Option 3: Brand Chips
          </CardTitle>
          <p className="text-purple-700">
            Shows all brands as rounded chips. Good visual appeal but takes more
            space.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {sampleUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center gap-4 p-3 bg-white rounded-lg border"
            >
              <div className="w-48 text-sm font-medium">{user.email}</div>
              <div className="w-32">
                <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">
                  {user.role.replace("_", " ")}
                </span>
              </div>
              <div className="flex-1">
                {user.role === "super_admin" ? (
                  <span className="text-sm text-gray-600 italic">
                    All brands access
                  </span>
                ) : (
                  <BrandChips brands={user.brands} className="max-w-xs" />
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Comparison Table</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Feature</th>
                  <th className="text-left p-2">Compact Display</th>
                  <th className="text-left p-2">Horizontal List</th>
                  <th className="text-left p-2">Brand Chips</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2 font-medium">Space Efficiency</td>
                  <td className="p-2 text-green-600">⭐⭐⭐⭐⭐</td>
                  <td className="p-2 text-yellow-600">⭐⭐⭐</td>
                  <td className="p-2 text-red-600">⭐⭐</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Readability</td>
                  <td className="p-2 text-green-600">⭐⭐⭐⭐⭐</td>
                  <td className="p-2 text-green-600">⭐⭐⭐⭐⭐</td>
                  <td className="p-2 text-green-600">⭐⭐⭐⭐⭐</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Scalability</td>
                  <td className="p-2 text-green-600">⭐⭐⭐⭐⭐</td>
                  <td className="p-2 text-yellow-600">⭐⭐⭐</td>
                  <td className="p-2 text-red-600">⭐⭐</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2 font-medium">Visual Appeal</td>
                  <td className="p-2 text-green-600">⭐⭐⭐⭐</td>
                  <td className="p-2 text-yellow-600">⭐⭐⭐</td>
                  <td className="p-2 text-green-600">⭐⭐⭐⭐⭐</td>
                </tr>
                <tr>
                  <td className="p-2 font-medium">Mobile Friendly</td>
                  <td className="p-2 text-green-600">⭐⭐⭐⭐⭐</td>
                  <td className="p-2 text-yellow-600">⭐⭐⭐</td>
                  <td className="p-2 text-yellow-600">⭐⭐⭐</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendation */}
      <Card className="border-2 border-green-300 bg-green-100">
        <CardHeader>
          <CardTitle className="text-green-800">🎯 Recommendation</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-green-700 mb-4">
            <strong>Compact Brand Display</strong> is recommended for the users
            table because it:
          </p>
          <ul className="list-disc list-inside space-y-2 text-green-700">
            <li>✅ Maximizes space efficiency in the table</li>
            <li>✅ Handles any number of brands gracefully</li>
            <li>✅ Provides tooltips for full brand information</li>
            <li>✅ Works perfectly on mobile devices</li>
            <li>✅ Maintains clean table layout</li>
            <li>✅ Shows "+X more" indicator for additional brands</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
