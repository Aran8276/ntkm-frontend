"use client"

import "leaflet/dist/leaflet.css"

import * as React from "react"
import type * as Leaflet from "leaflet"
import { IconCurrentLocation, IconMapPin, IconNavigation, IconSearch, IconX } from "@tabler/icons-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { toast } from "@/components/ui/toast"

/** OpenStreetMap raster tiles. */
const TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png"
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>'
/** Photon (OpenStreetMap data): address search-as-you-type and reverse geocoding. */
const GEOCODER_URL = "https://photon.komoot.io"
/** Indonesia, as `minLon,minLat,maxLon,maxLat`. */
const SEARCH_BBOX = "94.9,-11.1,141.1,6.2"

export interface LatLng {
  lat: number
  lng: number
}

const round6 = (n: number) => Math.round(n * 1e6) / 1e6

const PIN_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="38" height="38" fill="currentColor" aria-hidden="true"><path d="M18.364 4.636a9 9 0 0 1 .203 12.519l-.203.21-4.243 4.242a3 3 0 0 1-4.097.135l-.144-.135-4.244-4.243A9 9 0 0 1 18.364 4.636zM12 8a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/></svg>'

function pinIcon(L: typeof Leaflet) {
  return L.divIcon({
    className: "text-primary drop-shadow-md",
    html: PIN_SVG,
    iconSize: [38, 38],
    iconAnchor: [19, 36],
  })
}

/**
 * Creates a Leaflet map in `ref` once the library has loaded (client only) and
 * keeps its size in sync with the container (tabs, collapsibles, dialogs).
 */
function useLeafletMap(
  ref: React.RefObject<HTMLDivElement | null>,
  setup: (L: typeof Leaflet, map: Leaflet.Map) => void,
  options: { center: LatLng; zoom: number; scrollWheelZoom: boolean }
) {
  const setupRef = React.useRef(setup)
  const optionsRef = React.useRef(options)
  React.useEffect(() => {
    let map: Leaflet.Map | undefined
    let observer: ResizeObserver | undefined
    let cancelled = false
    void import("leaflet").then((mod) => {
      const el = ref.current
      if (cancelled || !el) return
      const L = ((mod as unknown as { default?: typeof Leaflet }).default ?? mod) as typeof Leaflet
      const o = optionsRef.current
      map = L.map(el, {
        center: [o.center.lat, o.center.lng],
        zoom: o.zoom,
        scrollWheelZoom: o.scrollWheelZoom,
        attributionControl: true,
      })
      map.attributionControl.setPrefix(false)
      L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(map)
      setupRef.current(L, map)
      observer = new ResizeObserver(() => map?.invalidateSize())
      observer.observe(el)
    })
    return () => {
      cancelled = true
      observer?.disconnect()
      map?.remove()
    }
  }, [ref])
}

// ---------------------------------------------------------------------------
// Geocoding
// ---------------------------------------------------------------------------

interface PhotonFeature {
  geometry: { coordinates: [number, number] }
  properties: Partial<
    Record<"name" | "street" | "housenumber" | "locality" | "district" | "city" | "county" | "state" | "postcode" | "country", string>
  >
}

export interface Place extends LatLng {
  /** Short first line (place or street name). */
  title: string
  /** Full address, ready for the address field. */
  address: string
}

function toPlace(f: PhotonFeature): Place {
  const p = f.properties
  const street = p.street ? (p.housenumber ? `${p.street} No. ${p.housenumber}` : p.street) : undefined
  const parts: string[] = []
  for (const part of [p.name, street, p.locality, p.district, p.county, p.city, p.state, p.postcode]) {
    if (part && !parts.some((x) => x.toLowerCase() === part.toLowerCase())) parts.push(part)
  }
  return {
    lat: round6(f.geometry.coordinates[1]),
    lng: round6(f.geometry.coordinates[0]),
    title: parts[0] ?? "Lokasi tanpa nama",
    address: parts.join(", "),
  }
}

async function geocode(path: string, params: Record<string, string>, signal?: AbortSignal): Promise<Place[]> {
  const res = await fetch(`${GEOCODER_URL}${path}?${new URLSearchParams(params)}`, { signal })
  if (!res.ok) throw new Error("geocoder")
  const data = (await res.json()) as { features?: PhotonFeature[] }
  return (data.features ?? []).map(toPlace)
}

// `lang=default` keeps local names ("Jawa Timur", not "East Java").
const searchPlaces = (q: string, near: LatLng, signal: AbortSignal) =>
  geocode("/api/", { q, limit: "6", lang: "default", bbox: SEARCH_BBOX, lat: String(near.lat), lon: String(near.lng) }, signal)

const reverseGeocode = (pos: LatLng, signal?: AbortSignal) =>
  geocode("/reverse", { lat: String(pos.lat), lon: String(pos.lng), lang: "default" }, signal).then((r) => r[0])

// ---------------------------------------------------------------------------
// Picker
// ---------------------------------------------------------------------------

/**
 * Leaflet map with a draggable pin, address search with suggestions and
 * "use my location". Emits the pin position (6 decimals) through `onChange`
 * and the chosen address text through `onAddress`.
 */
export function LocationPicker({
  lat,
  lng,
  onChange,
  onAddress,
}: {
  lat?: number
  lng?: number
  onChange?: (pos: LatLng) => void
  /** Called with a full address when the user picks a suggestion or accepts the pin's address. */
  onAddress?: (address: string) => void
}) {
  const hasInitial = lat != null && lng != null
  const [pos, setPos] = React.useState<LatLng>({ lat: lat ?? -7.9467, lng: lng ?? 112.6159 })
  const [locating, setLocating] = React.useState(false)
  /** Address found under the pin after it was moved by hand. */
  const [pinAddress, setPinAddress] = React.useState<string | null>(null)

  const boxRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<Leaflet.Map | null>(null)
  const markerRef = React.useRef<Leaflet.Marker | null>(null)
  const onChangeRef = React.useRef(onChange)
  const reverseRef = React.useRef<AbortController | null>(null)
  React.useEffect(() => {
    onChangeRef.current = onChange
  })

  /** Move the pin; `lookup` also finds the address under it. */
  const place = React.useCallback((next: LatLng, opts: { pan?: boolean; lookup?: boolean } = {}) => {
    const p = { lat: round6(next.lat), lng: round6(next.lng) }
    setPos(p)
    onChangeRef.current?.(p)
    markerRef.current?.setLatLng([p.lat, p.lng])
    if (opts.pan) mapRef.current?.setView([p.lat, p.lng], Math.max(mapRef.current.getZoom(), 17))
    reverseRef.current?.abort()
    setPinAddress(null)
    if (opts.lookup) {
      const ctrl = new AbortController()
      reverseRef.current = ctrl
      reverseGeocode(p, ctrl.signal)
        .then((found) => found && setPinAddress(found.address))
        .catch(() => undefined)
    }
  }, [])

  useLeafletMap(
    boxRef,
    (L, map) => {
      mapRef.current = map
      const marker = L.marker([pos.lat, pos.lng], {
        icon: pinIcon(L),
        draggable: true,
        autoPan: true,
        keyboard: true,
        title: "Seret pin ke posisi yang tepat",
        alt: "Pin lokasi",
      }).addTo(map)
      markerRef.current = marker
      marker.on("dragend", () => {
        const ll = marker.getLatLng()
        place({ lat: ll.lat, lng: ll.lng }, { lookup: true })
      })
      map.on("click", (e: Leaflet.LeafletMouseEvent) => place({ lat: e.latlng.lat, lng: e.latlng.lng }, { lookup: true }))
    },
    { center: pos, zoom: hasInitial ? 17 : 13, scrollWheelZoom: true }
  )
  // Report the starting position too, so the form saves exactly what the map shows.
  React.useEffect(() => {
    onChangeRef.current?.(pos)
    return () => reverseRef.current?.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount only
  }, [])

  const useMyLocation = () => {
    if (!("geolocation" in navigator)) {
      toast.add({ title: "Perangkat tidak mendukung lokasi.", type: "error" })
      return
    }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false)
        place({ lat: p.coords.latitude, lng: p.coords.longitude }, { pan: true, lookup: true })
      },
      () => {
        setLocating(false)
        toast.add({ title: "Izin lokasi ditolak. Cari alamat atau geser pin secara manual.", type: "error" })
      },
      { enableHighAccuracy: true, timeout: 10_000 }
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <AddressSearch
        near={pos}
        onPick={(p) => {
          place(p, { pan: true })
          onAddress?.(p.address)
        }}
      />
      <div className="relative isolate z-0">
        <div
          ref={boxRef}
          className="h-64 w-full bg-muted font-sans sm:h-72"
          role="application"
          aria-label="Peta lokasi. Ketuk peta atau seret pin ke posisi yang tepat."
        />
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="absolute right-3 bottom-7 z-[1000] bg-background"
          onClick={useMyLocation}
          disabled={locating}
        >
          <IconCurrentLocation data-icon="inline-start" />
          {locating ? "Mencari…" : "Gunakan lokasi saya"}
        </Button>
      </div>
      {pinAddress && onAddress && (
        <div className="flex flex-col gap-2 bg-muted/70 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          <p className="min-w-0">
            <span className="block text-[0.625rem] font-semibold tracking-widest text-muted-foreground uppercase">Alamat di titik pin</span>
            {pinAddress}
          </p>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="shrink-0 self-start bg-background sm:self-auto"
            onClick={() => {
              onAddress(pinAddress)
              setPinAddress(null)
            }}
          >
            Pakai alamat ini
          </Button>
        </div>
      )}
      <p className="font-mono text-xs text-muted-foreground tabular-nums">
        {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}
      </p>
    </div>
  )
}

/** Search box with address suggestions (combobox). */
function AddressSearch({ near, onPick }: { near: LatLng; onPick: (place: Place) => void }) {
  const listId = React.useId()
  const [query, setQuery] = React.useState("")
  const [results, setResults] = React.useState<Place[]>([])
  const [state, setState] = React.useState<"idle" | "loading" | "done" | "error">("idle")
  const [open, setOpen] = React.useState(false)
  const [active, setActive] = React.useState(-1)
  const nearRef = React.useRef(near)
  React.useEffect(() => {
    nearRef.current = near
  })

  const search = (value: string) => {
    setQuery(value)
    setOpen(true)
    setActive(-1)
    if (value.trim().length < 3) {
      setResults([])
      setState("idle")
    } else setState("loading")
  }

  // Debounced lookup; a newer keystroke cancels the request in flight.
  const term = query.trim()
  React.useEffect(() => {
    if (term.length < 3) return
    const ctrl = new AbortController()
    const timer = setTimeout(() => {
      searchPlaces(term, nearRef.current, ctrl.signal)
        .then((found) => {
          setResults(found)
          setState("done")
        })
        .catch((e: Error) => {
          if (e.name !== "AbortError") setState("error")
        })
    }, 350)
    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [term])

  const pick = (p: Place) => {
    onPick(p)
    setQuery(p.address)
    setOpen(false)
    setResults([])
    setState("idle")
  }

  const showList = open && term.length >= 3 && state !== "idle"

  return (
    <div
      className="relative z-10"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false)
      }}
    >
      <div className="flex h-11 items-center gap-2 border bg-background px-3 focus-within:border-ring">
        {state === "loading" ? (
          <Spinner className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <IconSearch className="size-4 shrink-0 text-muted-foreground" stroke={1.75} />
        )}
        <input
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          aria-label="Cari alamat atau nama tempat"
          placeholder="Cari alamat atau nama tempat…"
          autoComplete="off"
          spellCheck={false}
          enterKeyHint="search"
          value={query}
          onChange={(e) => search(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown" && results.length) {
              e.preventDefault()
              setOpen(true)
              setActive((i) => (i + 1) % results.length)
            } else if (e.key === "ArrowUp" && results.length) {
              e.preventDefault()
              setActive((i) => (i <= 0 ? results.length - 1 : i - 1))
            } else if (e.key === "Enter") {
              // Never submit the surrounding profile form from the search box.
              e.preventDefault()
              const choice = results[active] ?? results[0]
              if (showList && choice) pick(choice)
            } else if (e.key === "Escape") setOpen(false)
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground md:text-sm"
        />
        {query && (
          <button
            type="button"
            aria-label="Hapus pencarian"
            onClick={() => search("")}
            className="flex size-7 shrink-0 items-center justify-center text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
          >
            <IconX className="size-4" />
          </button>
        )}
      </div>
      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Saran alamat"
          className="absolute inset-x-0 top-full z-20 mt-1 max-h-72 overflow-y-auto border bg-popover text-popover-foreground shadow-md"
        >
          {results.map((r, i) => (
            <li key={`${r.lat},${r.lng},${i}`} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <button
                type="button"
                tabIndex={-1}
                onMouseEnter={() => setActive(i)}
                onClick={() => pick(r)}
                className={cn("flex w-full items-start gap-3 px-3 py-2.5 text-left text-sm outline-none", i === active && "bg-muted")}
              >
                <IconMapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" stroke={1.75} />
                <span className="min-w-0">
                  <span className="block font-medium">{r.title}</span>
                  <span className="block text-xs text-muted-foreground">{r.address}</span>
                </span>
              </button>
            </li>
          ))}
          {!results.length && (
            <li className="px-3 py-3 text-sm text-muted-foreground">
              {state === "loading"
                ? "Mencari alamat…"
                : state === "error"
                  ? "Pencarian alamat sedang tidak tersedia. Geser pin di peta secara manual."
                  : "Alamat tidak ditemukan. Coba nama jalan atau kelurahan, lalu geser pin."}
            </li>
          )}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Read-only map
// ---------------------------------------------------------------------------

/** Read-only Leaflet map with one pin and an optional "Petunjuk arah" link. */
export function LocationMap({
  lat,
  lng,
  label,
  directions = true,
  className,
}: {
  lat: number
  lng: number
  /** Accessible name of the place the pin marks. */
  label?: string
  directions?: boolean
  className?: string
}) {
  const boxRef = React.useRef<HTMLDivElement>(null)
  const mapRef = React.useRef<Leaflet.Map | null>(null)
  const markerRef = React.useRef<Leaflet.Marker | null>(null)

  useLeafletMap(
    boxRef,
    (L, map) => {
      mapRef.current = map
      markerRef.current = L.marker([lat, lng], { icon: pinIcon(L), keyboard: false, alt: label ?? "Pin lokasi" }).addTo(map)
    },
    { center: { lat, lng }, zoom: 16, scrollWheelZoom: false }
  )
  React.useEffect(() => {
    markerRef.current?.setLatLng([lat, lng])
    mapRef.current?.setView([lat, lng])
  }, [lat, lng])

  return (
    <div className={cn("relative isolate z-0", className)}>
      <div ref={boxRef} className="h-56 w-full bg-muted font-sans" role="application" aria-label={label ? `Peta lokasi ${label}` : "Peta lokasi"} />
      {directions && (
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-3 bottom-7 z-[1000] inline-flex h-7 items-center gap-1.5 border bg-background px-3 text-xs font-semibold tracking-widest uppercase shadow-sm hover:bg-muted"
        >
          <IconNavigation className="size-3" />
          Petunjuk arah
        </a>
      )}
    </div>
  )
}
