"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  MessageCircle,
} from "lucide-react";

interface InboxTestResult {
  statsWorking: boolean;
  inquiriesWorking: boolean;
  databaseWorking: boolean;
  errors: string[];
  data: any;
}

export default function InboxTest() {
  const [result, setResult] = useState<InboxTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  const runInboxTest = async () => {
    setTesting(true);
    const errors: string[] = [];
    let statsWorking = false;
    let inquiriesWorking = false;
    let databaseWorking = false;
    let data: any = {};

    try {
      // Test 1: Inbox Stats API
      console.log("🔍 Testing inbox stats API...");
      const statsResponse = await fetch("/api/studio/inbox/stats", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        statsWorking = true;
        data.stats = statsData;
        console.log("✅ Inbox stats working:", statsData);
      } else {
        const errorText = await statsResponse.text();
        errors.push(`Stats API failed: ${statsResponse.status} ${errorText}`);
        console.log("❌ Stats failed:", statsResponse.status, errorText);
      }

      // Test 2: Inquiries List API
      console.log("🔍 Testing inquiries list API...");
      const inquiriesResponse = await fetch("/api/studio/inbox?limit=5", {
        method: "GET",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (inquiriesResponse.ok) {
        const inquiriesData = await inquiriesResponse.json();
        inquiriesWorking = true;
        data.inquiries = inquiriesData;
        console.log("✅ Inquiries working:", inquiriesData);
      } else {
        const errorText = await inquiriesResponse.text();
        errors.push(
          `Inquiries API failed: ${inquiriesResponse.status} ${errorText}`
        );
        console.log(
          "❌ Inquiries failed:",
          inquiriesResponse.status,
          errorText
        );
      }

      // Test 3: Check if we have data
      if (statsWorking && inquiriesWorking) {
        databaseWorking = true;
        console.log("✅ Database connection working");
      }
    } catch (error) {
      errors.push(`Test failed: ${error}`);
      console.error("❌ Test error:", error);
    }

    setResult({
      statsWorking,
      inquiriesWorking,
      databaseWorking,
      errors,
      data,
    });
    setTesting(false);
  };

  const getStatusIcon = (isWorking: boolean) => {
    return isWorking ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Inbox System Test
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={runInboxTest}
            disabled={testing}
            variant="outline"
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${testing ? "animate-spin" : ""}`} />
            {testing ? "Testing..." : "Test Inbox System"}
          </Button>
        </div>

        {result && (
          <div className="space-y-4">
            {/* Test Results */}
            <div className="grid grid-cols-1 gap-2">
              <div className="flex items-center gap-2">
                {getStatusIcon(result.statsWorking)}
                <span>Inbox Stats API</span>
                {result.statsWorking && (
                  <Badge variant="secondary">
                    {result.data.stats?.totalInquiries || 0} inquiries
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(result.inquiriesWorking)}
                <span>Inquiries List API</span>
                {result.inquiriesWorking && (
                  <Badge variant="secondary">
                    {result.data.inquiries?.inquiries?.length || 0} loaded
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(result.databaseWorking)}
                <span>Database Connection</span>
              </div>
            </div>

            {/* Data Preview */}
            {result.databaseWorking && result.data.stats && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="font-semibold text-green-900 mb-2">
                  📊 Inbox Stats
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Total: {result.data.stats.totalInquiries}</div>
                  <div>Unread: {result.data.stats.unreadInquiries}</div>
                  <div>Replied: {result.data.stats.repliedInquiries}</div>
                  <div>Urgent: {result.data.stats.urgentInquiries}</div>
                </div>
              </div>
            )}

            {/* Sample Inquiries */}
            {result.data.inquiries?.inquiries?.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">
                  📝 Sample Inquiries
                </h4>
                <div className="space-y-2">
                  {result.data.inquiries.inquiries
                    .slice(0, 3)
                    .map((inquiry: any) => (
                      <div
                        key={inquiry.id}
                        className="text-sm bg-white p-2 rounded border"
                      >
                        <div className="font-medium">
                          {inquiry.customer_name}
                        </div>
                        <div className="text-gray-600 truncate">
                          {inquiry.subject}
                        </div>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {inquiry.status}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {inquiry.brand_name}
                          </Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Errors */}
            {result.errors.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <strong>Issues Found:</strong>
                    <ul className="list-disc list-inside space-y-1">
                      {result.errors.map((error, index) => (
                        <li key={index} className="text-sm">
                          {error}
                        </li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {result.databaseWorking && result.errors.length === 0 && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <span className="text-green-800">
                    ✅ Inbox system is working perfectly! The feature is ready
                    to use.
                  </span>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
