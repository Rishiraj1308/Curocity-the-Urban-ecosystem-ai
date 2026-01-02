"use client";

import React, { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"; // Adjust import if needed
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Star, Car } from "lucide-react";
import type { RideData, GarageRequest, AmbulanceCase } from "@/lib/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const DriverArriving = dynamic(
  () => import("@/features/user/components/ride/DriverArriving"),
  {
    ssr: false,
    loading: () => <Skeleton className="h-64 w-full rounded-t-xl" />,
  }
);

const SearchingIndicator = dynamic(
  () => import("@/components/ui/searching-indicator"),
  { ssr: false }
);

interface RideStatusSheetProps {
  ride: RideData | GarageRequest | AmbulanceCase;
  isGarageRequest?: boolean;
  isAmbulanceCase?: boolean;
  onCancel: () => void;
  onDone: () => void;
  isOpen?: boolean; // Optional control
}

export default function RideStatusSheet({
  ride,
  onCancel,
  isGarageRequest,
  isAmbulanceCase,
  onDone,
  isOpen = true,
}: RideStatusSheetProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [rating, setRating] = useState(0);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

  const status = ride?.status || "searching";

  const handleCancelClick = async () => {
    setIsCancelling(true);
    await onCancel();
    setIsCancelling(false);
  };

  const handleRatingSubmit = async () => {
    if (rating === 0) return toast.info("Please select a rating.");
    setIsRatingSubmitting(true);
    setTimeout(() => {
      onDone();
      setIsRatingSubmitting(false);
    }, 700);
  };

  // --- SUB-COMPONENTS ---

  const renderSearching = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[300px]">
      <SearchingIndicator partnerType="path" />
      <p className="mt-4 text-lg font-semibold">Finding your driver...</p>
      <p className="text-sm text-muted-foreground">Looking for a nearby partner</p>
      <Button
        variant="destructive"
        className="mt-6 w-full"
        disabled={isCancelling}
        onClick={handleCancelClick}
      >
        {isCancelling ? "Cancelling..." : "Cancel Ride"}
      </Button>
    </div>
  );

  const renderNoDrivers = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center h-full min-h-[200px]">
      <h2 className="text-xl font-semibold">No Drivers Available</h2>
      <p className="text-sm text-muted-foreground mt-1">Try again later.</p>
      <Button className="mt-6 w-full" onClick={onCancel}>
        Okay
      </Button>
    </div>
  );

  const renderCompleted = () => (
    <div className="p-6 text-center">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
        <Car className="w-8 h-8 text-green-600" />
      </div>
      <h2 className="text-2xl font-bold">Ride Completed</h2>
      
      <div className="mt-6 p-4 border rounded-xl">
        <p className="font-semibold mb-2">Rate Your Ride</p>
        <div className="flex justify-center gap-2 mb-4">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              onClick={() => setRating(star)}
              className={`w-8 h-8 cursor-pointer transition-colors ${
                rating >= star ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
              }`}
            />
          ))}
        </div>
        <Button 
            className="w-full" 
            onClick={handleRatingSubmit}
            disabled={isRatingSubmitting}
        >
          {isRatingSubmitting ? "Submitting..." : "Submit Rating"}
        </Button>
      </div>
    </div>
  );

  // --- CONTENT SWITCHER ---

  let content = renderSearching();

  if (status === "searching") {
    content = renderSearching();
  } else if (status === "no_drivers_available") {
    content = renderNoDrivers();
  } else if (
    status === "accepted" ||
    status === "arrived" ||
    status === "in-progress" ||
    status === "in_progress" ||
    status === "dispatched"
  ) {
    // 🔥 FIX: Return DriverArriving directly (it handles its own layout usually)
    // or wrap in a div if needed.
    return (
        <div className="w-full h-full bg-white rounded-t-3xl overflow-hidden">
             <DriverArriving ride={ride as RideData} onCancel={onCancel} />
        </div>
    )
  } else if (status === "payment_pending") {
    content = (
      <div className="p-6 text-center">
        <p className="text-lg font-semibold">Payment Pending...</p>
        <p className="text-sm text-muted-foreground">Please pay the driver.</p>
      </div>
    );
  } else if (status === "completed") {
    content = renderCompleted();
  }

  // Agar sheet use kar rahe ho toh wrapper:
  return (
     <div className="w-full bg-white shadow-[0_-5px_20px_rgba(0,0,0,0.1)] rounded-t-3xl min-h-[300px]">
        {content}
     </div>
  );
}