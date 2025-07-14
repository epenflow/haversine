import { createFileRoute } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { type Marker as MarkerRef } from "leaflet";
import "leaflet/dist/leaflet.css";
import { SatelliteDish } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import {
  Circle,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
} from "react-leaflet";
import * as z from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "~/components/ui/resizable";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils";

const geoLocationSchema = z.object({
  default: fallback(
    z
      .object({
        radius: fallback(z.number(), 0),
        longitude: fallback(z.number(), 0),
        latitude: fallback(z.number(), 0),
        zoom: fallback(z.number(), 10).default(10),
      })
      .optional(),
    undefined
  ),
  coords: fallback(
    z
      .object({
        longitude: fallback(z.number(), 0),
        latitude: fallback(z.number(), 0),
      })
      .optional(),
    undefined
  ),
});

export const Route = createFileRoute("/")({
  validateSearch: zodValidator(geoLocationSchema),
  component: Page,
});

function Page() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch();

  const markerRef = useRef<MarkerRef>(null);

  const [distance, setDistance] = useState<number>(0);
  const [open, setOpen] = useState<boolean>(true);
  const [draggable, setDraggable] = useState<boolean>(false);
  const [allowLocation, setAllowLocation] = useState<boolean>(false);
  const [isInTheRadius, setIsInTheRadius] = useState<boolean>(false);

  const haversine = useCallback(
    (lat1: number, long1: number, lat2: number, long2: number) => {
      // Earth Radius in METER
      const EARTH_RADIUS = 6371e3;
      // Converts Latitude to Radians
      const phi1 = (lat1 * Math.PI) / 180;
      // Converts Longitude to Radians
      const phi2 = (lat2 * Math.PI) / 180;

      // Difference in Latitude in Radians
      const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
      // Difference in Longitude in Radians
      const deltaLambda = ((long2 - long1) * Math.PI) / 180;

      // Haversine Formula
      const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) *
          Math.cos(phi2) *
          Math.sin(deltaLambda / 2) *
          Math.sin(deltaLambda / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

      // Distance in meter
      return EARTH_RADIUS * c;
    },
    []
  );

  const handleLocationOnSuccess = useCallback(
    ({ coords }: GeolocationPosition) => {
      console.log("[Location Success] -  set the coordinates");
      navigate({
        search: {
          ...search,
          coords,
        },
      });
    },
    [search, navigate]
  );

  const handleLocationOnError = useCallback(
    ({ message }: GeolocationPositionError) => {
      console.warn("[Location Error] - ", message);
      navigate({
        search: {
          ...search,
          coords: undefined,
        },
      });
      setAllowLocation(false);
    },
    [search, navigate]
  );

  const handleAllowLocation = useCallback(() => {
    if (navigator.geolocation) {
      console.log("[Geo Location] - Geo Location starting");

      setAllowLocation(true);

      navigator.geolocation.getCurrentPosition(
        handleLocationOnSuccess,
        handleLocationOnError
      );
    } else {
      console.warn(
        "[Geo Location] - Geo Location is not supported by this browser"
      );
      setAllowLocation(false);
      navigate({
        search: {
          ...search,
          coords: undefined,
        },
      });
    }
  }, [search, navigate, handleLocationOnSuccess, handleLocationOnError]);

  useEffect(() => {
    let watchId: number;

    if (allowLocation) {
      if (navigator.geolocation) {
        console.log("[Geo Location] - Geo Location starting");

        watchId = navigator.geolocation.watchPosition(
          handleLocationOnSuccess,
          handleLocationOnError
        );
      } else {
        console.warn(
          "[Geo Location] - Geo Location is not supported by this browser"
        );
        setAllowLocation(false);
        navigate({
          search: {
            ...search,
            coords: undefined,
          },
        });
      }
    }

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [
    search,
    navigate,
    allowLocation,
    handleLocationOnSuccess,
    handleLocationOnError,
  ]);

  useEffect(() => {
    if (search.default && search.coords) {
      const {
        default: { latitude: lat1, longitude: long1, radius },
        coords: { latitude: lat2, longitude: long2 },
      } = search;
      const _distance = haversine(lat1, long1, lat2, long2);

      setDistance(_distance);
      setIsInTheRadius(_distance <= radius);
    } else {
      setDistance(0);
      setIsInTheRadius(false);
    }
  }, [search, haversine]);

  return (
    <>
      <ResizablePanelGroup direction="horizontal" className="min-h-dvh h-dvh">
        <ResizablePanel>
          <div
            className={cn(
              "relative flex",
              "before:pattern-diagonal before:min-h-auto before:w-full before:[--diagonal-space:5px]",
              "after:pattern-diagonal after:min-h-auto after:w-full after:[--diagonal-angle:-45deg] after:[--diagonal-space:5px]"
            )}>
            <div className="w-full max-w-xl h-dvh p-10 shrink-0 border-x bg-background">
              <div className="space-y-1">
                <h1 className="text-sm font-medium text-primary">Default</h1>
                <div className="transition-all focus-within:border-b-sky-500 group border-b">
                  <Field
                    label="Radius(M)"
                    value={search.default?.radius}
                    onFieldChange={(e) =>
                      navigate({
                        search: {
                          ...search,
                          default: {
                            ...search.default!,
                            radius: e.target.valueAsNumber,
                          },
                        },
                      })
                    }
                  />
                </div>

                <div className="grid gap-2 grid-cols-2 transition-all focus-within:border-b-sky-500 group border-b">
                  <Field
                    label="Lat 1"
                    value={search.default?.latitude}
                    onFieldChange={(e) =>
                      navigate({
                        search: {
                          ...search,
                          default: {
                            ...search.default!,
                            latitude: e.target.valueAsNumber,
                          },
                        },
                      })
                    }
                  />
                  <Field
                    label="Long 1"
                    value={search.default?.longitude}
                    onFieldChange={(e) =>
                      navigate({
                        search: {
                          ...search,
                          default: {
                            ...search.default!,
                            longitude: e.target.valueAsNumber,
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-1 mt-5">
                <h1 className="text-sm font-medium text-primary">
                  Your Coordinate
                </h1>
                <div className="grid gap-2 grid-cols-2 transition-all focus-within:border-b-sky-500 group border-b">
                  <Field
                    label="Lat 2"
                    value={search.coords?.latitude}
                    onFieldChange={(e) =>
                      navigate({
                        search: {
                          ...search,
                          coords: {
                            ...search.coords!,
                            latitude: e.target.valueAsNumber,
                          },
                        },
                      })
                    }
                  />
                  <Field
                    label="Long 2"
                    value={search.coords?.longitude}
                    onFieldChange={(e) =>
                      navigate({
                        search: {
                          ...search,
                          coords: {
                            ...search.coords!,
                            longitude: e.target.valueAsNumber,
                          },
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div className="text-primary font-medium border-b py-5 text-sm">
                <p>Distance : {(distance / 1000).toFixed(2)} (KM)</p>
                <p className={cn(!isInTheRadius && "text-destructive")}>
                  {isInTheRadius
                    ? "You are within the radius!"
                    : "You are outside the radius."}
                </p>
              </div>
            </div>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel>
          {allowLocation ? (
            <MapContainer
              style={{ width: "100%", height: "100%" }}
              zoom={search.default?.zoom ?? 10}
              center={[
                search.default?.latitude ?? 0,
                search.default?.longitude ?? 0,
              ]}>
              <MapResizer />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <>
                <Circle
                  pathOptions={{
                    stroke: false,
                    fillColor: isInTheRadius ? "green" : "red",
                    fillOpacity: 0.2,
                  }}
                  radius={search.default?.radius ?? 0}
                  center={[
                    search.default?.latitude ?? 0,
                    search.default?.longitude ?? 0,
                  ]}
                />

                <Marker
                  draggable={draggable}
                  eventHandlers={{
                    dragend: () => {
                      if (markerRef.current) {
                        const { lat: latitude, lng: longitude } =
                          markerRef.current.getLatLng();

                        navigate({
                          search: {
                            ...search,
                            default: {
                              ...search.default!,
                              latitude,
                              longitude,
                            },
                          },
                        });
                      }
                    },
                  }}
                  ref={markerRef}
                  position={[
                    search.default?.latitude ?? 0,
                    search.default?.longitude ?? 0,
                  ]}>
                  <Popup>
                    <div
                      onClick={() => setDraggable((prev) => !prev)}
                      className="text-xs text-primary">
                      <p>Click to make marker draggable</p>
                      <p
                        className={cn(
                          "cursor-pointer",
                          !draggable && "text-destructive"
                        )}>
                        {draggable
                          ? "Marker is draggable"
                          : "Marker is not draggable"}
                      </p>
                    </div>
                  </Popup>
                  <Tooltip>Default Location</Tooltip>
                </Marker>
              </>

              <Marker
                position={[
                  search.coords?.latitude ?? 0,
                  search.coords?.longitude ?? 0,
                ]}>
                <Tooltip>Your Location</Tooltip>
              </Marker>
            </MapContainer>
          ) : (
            <Skeleton className="h-full w-full rounded-none" />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex justify-center mb-3">
              <SatelliteDish className="size-36 stroke-sky-500" />
            </div>
            <AlertDialogTitle>Location Services Required</AlertDialogTitle>
            <AlertDialogDescription>
              This application requires access to your device's geolocation to
              function correctly. Please enable GPS in your browser settings.
              This helps us determine your proximity to the set radius.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen(false)}>
              Not Now
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleAllowLocation}>
              Enable Geolocation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function Field({
  label,
  value,
  onFieldChange,
}: {
  label: string;
  value?: number;
  onFieldChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  const id = useId();

  return (
    <div className="flex h-14 items-center justify-between ">
      <label
        htmlFor={id}
        className="mr-10 whitespace-nowrap font-medium my-0 text-sm">
        {label}
      </label>
      <input
        id={id}
        value={value}
        type="number"
        onChange={onFieldChange}
        className="-mb-[5px] origin-[right_top] scale-[0.875] text-base sm:mb-0 sm:scale-100 sm:text-sm w-full bg-sky-500/10 text-right caret-sky-500 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 col-span-2 h-fit"
      />
    </div>
  );
}

function MapResizer() {
  const map = useMap();

  useEffect(() => {
    const resize = new ResizeObserver(() => map.invalidateSize());

    const container = map.getContainer();

    if (container) {
      resize.observe(container);
    }
    return () => {
      if (container) {
        resize.disconnect();
      }
    };
  }, [map]);

  return null;
}
/**
 * Done
 */
