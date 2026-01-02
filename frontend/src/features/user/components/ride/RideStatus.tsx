'use client';

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardTitle,
} from "@/components/ui/card";
import { Star, Car } from "lucide-react";
import type { RideData, GarageRequest, AmbulanceCase } from "@/lib/types";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";

const DriverArriving = dynamic(
  () => import("@/features/user/components/ride/DriverArriving"),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full flex items-center justify-center">
        <Skeleton className="h-full w-full" />
      </div>
    ),
  }
);

const SearchingIndicator = dynamic(
  () => import("@/components/ui/searching-indicator"),
  { ssr: false }
);

interface RideStatusProps {
  ride: RideData | GarageRequest | AmbulanceCase;
  isGarageRequest?: boolean;
  isAmbulanceCase?: boolean;
  onCancel: () => void;
  onDone: () => void;
}

export default function RideStatus({
  ride,
  onCancel,
  isGarageRequest,
  isAmbulanceCase,
  onDone,
}: RideStatusProps) {
  const [isCancelling, setIsCancelling] = useState(false);
  const [rating, setRating] = useState(0);
  const [isRatingSubmitting, setIsRatingSubmitting] = useState(false);

  const status = ride.status;

  // Cancel Request
  const handleCancelClick = async () => {
    setIsCancelling(true);
    await onCancel();
    setIsCancelling(false);
  };

  // Rating Submit
  const handleRatingSubmit = async () => {
    if (rating === 0) return toast.info("Please select a rating.");

    setIsRatingSubmitting(true);
    setTimeout(() => {
      onDone();
      setIsRatingSubmitting(false);
    }, 700);
  };

  // UI — Searching
  const renderSearching = () => (
    <Card className="w-full max-w-md mx-auto h-full flex flex-col shadow-xl">
      <CardContent className="p-6 flex flex-col items-center justify-center flex-1 text-center">
        <SearchingIndicator partnerType="path" />
        <p className="mt-4 text-lg font-semibold">Finding your driver…</p>
        <p className="text-sm text-muted-foreground">
          Looking for a nearby partner
        </p>

        <Button
          variant="destructive"
          className="mt-6 w-full max-w-xs"
          disabled={isCancelling}
          onClick={handleCancelClick}
        >
          {isCancelling ? "Cancelling…" : "Cancel Ride"}
        </Button>
      </CardContent>
    </Card>
  );

  // UI — No Drivers
  const renderNoDrivers = () => (
    <Card className="w-full max-w-md mx-auto h-full flex flex-col justify-center items-center p-6 text-center">
      <h2 className="text-xl font-semibold">No Drivers Available</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Try again after a few minutes.
      </p>
      <Button className="mt-6 w-full" onClick={onCancel}>
        Okay
      </Button>
    </Card>
  );

  // UI — Completed
  const renderCompleted = () => (
    <Card className="w-full max-w-md mx-auto h-full flex flex-col justify-center shadow-xl">
      <div className="text-center p-6">
        <div className="mx-auto w-20 h-20 rounded-full bg-green-500/10 border-4 border-green-500/20 flex items-center justify-center mb-4">
          <Car className="w-10 h-10 text-green-600" />
        </div>

        <h2 className="text-2xl font-bold">Ride Completed</h2>
        <p className="text-muted-foreground">Thanks for choosing us</p>

        <Card className="mt-6 p-4">
          <CardTitle className="text-center">Rate Your Ride</CardTitle>
          <div className="flex justify-center gap-2 py-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                onClick={() => setRating(star)}
                className={
                  rating >= star
                    ? "w-10 h-10 text-yellow-400 fill-yellow-400 cursor-pointer"
                    : "w-10 h-10 text-muted-foreground cursor-pointer"
                }
              />
            ))}
          </div>

          <Button
            className="w-full"
            onClick={handleRatingSubmit}
            disabled={isRatingSubmitting}
          >
            {isRatingSubmitting ? "Submitting…" : "Submit Rating"}
          </Button>
        </Card>
      </div>
    </Card>
  );

  // ========================================================
  // FINAL STATUS MATCHING (FIXED)
  // ========================================================

  // 1 — Searching
  // 🔥 FIX: "pending" hata diya kyunki types mein nahi tha
  if (status === "searching")
    return renderSearching();

  // 2 — No drivers found
  if (status === "no_drivers_available") return renderNoDrivers();

  // 3 — Driver Assigned / Arriving / In Progress
  if (
    status === "accepted" ||
    status === "arrived" ||
    status === "in-progress" || // For RideData
    status === "in_progress" || // For GarageRequest
    status === "dispatched"     // For AmbulanceCase
  ) {
    // Note: DriverArriving expects RideData structure mostly. 
    // Ensure it handles generic fields if dealing with Garage/Ambulance.
    return <DriverArriving ride={ride as RideData} onCancel={onCancel} />;
  }

  // 4 — Payment Phase
  // 🔥 FIX: "bill_sent" hata diya kyunki types mein nahi tha
  if (status === "payment_pending") {
    return (
      <Card className="w-full max-w-md mx-auto p-6 text-center">
        <p className="text-lg font-semibold">Payment Pending…</p>
      </Card>
    );
  }

  // 5 — Completed
  if (status === "completed") return renderCompleted();

  // Fallback
  return renderSearching();
}