"use client"

import { Navbar } from "@/components/navbar"
import { EventCard } from "@/components/event-card"
import { useAuth } from "@/components/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useState, useEffect, useMemo } from "react"
import { Search, Loader2, Filter, Calendar, MapPin, IndianRupee } from "lucide-react"


const categories = ["All", "workshop", "hackathon", "conference", "competition", "tech fest"]

export default function EventsPage() {
  const { session } = useAuth()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [sortBy, setSortBy] = useState("date")
  const [priceFilter, setPriceFilter] = useState("all")
  const [events, setEvents] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true)
        const params = new URLSearchParams()
        if (searchQuery) params.append("search", searchQuery)
        if (selectedCategory !== "All") params.append("category", selectedCategory)

        const response = await fetch(`/api/events?${params.toString()}`)
        if (!response.ok) {
          throw new Error("Failed to fetch events")
        }
        const data = await response.json()
        setEvents(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error("[v0] Fetch events error:", error)
        // Set empty array instead of mock data
        setEvents([])
      } finally {
        setIsLoading(false)
      }
    }

    // Debounce search
    const timeoutId = setTimeout(fetchEvents, 300)
    return () => clearTimeout(timeoutId)
  }, [searchQuery, selectedCategory])

  // Filter and sort events on client side
  const filteredAndSortedEvents = useMemo(() => {
    let filtered = [...events]

    // Price filter
    if (priceFilter === "free") {
      filtered = filtered.filter((e) => !e.price || e.price === 0)
    } else if (priceFilter === "paid") {
      filtered = filtered.filter((e) => e.price && e.price > 0)
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
        case "price-low":
          return (a.price || 0) - (b.price || 0)
        case "price-high":
          return (b.price || 0) - (a.price || 0)
        case "popular":
          return (b.current_capacity || 0) - (a.current_capacity || 0)
        default:
          return 0
      }
    })

    return filtered
  }, [events, priceFilter, sortBy])

  return (
    <main>
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="space-y-8 mb-12 animate-fade-in">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold gradient-text">Browse Events</h1>
            <p className="text-muted-foreground">Find and register for the best educational events</p>
          </div>

          {/* Search and Filter */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search events by title, description, location..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="md:w-auto w-full"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
            </div>

            {/* Advanced Filters */}
            {showFilters && (
              <div className="glass p-4 rounded-lg space-y-4 animate-scale-in">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Sort By */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      Sort By
                    </label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date (Soonest First)</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="price-low">Price (Low to High)</SelectItem>
                        <SelectItem value="price-high">Price (High to Low)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Price Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <IndianRupee className="w-4 h-4" />
                      Price
                    </label>
                    <Select value={priceFilter} onValueChange={setPriceFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Events</SelectItem>
                        <SelectItem value="free">Free Only</SelectItem>
                        <SelectItem value="paid">Paid Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Reset Filters */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium opacity-0">Reset</label>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setSearchQuery("")
                        setSelectedCategory("All")
                        setSortBy("date")
                        setPriceFilter("all")
                      }}
                    >
                      Reset All
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category, index) => (
                <Badge
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="cursor-pointer capitalize hover:scale-105 transition-transform stagger-item"
                  onClick={() => setSelectedCategory(category)}
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {category}
                </Badge>
              ))}
            </div>

            {/* Results count */}
            {!isLoading && (
              <div className="text-sm text-muted-foreground">
                Found {filteredAndSortedEvents.length} event{filteredAndSortedEvents.length !== 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>

        {/* Events Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredAndSortedEvents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedEvents.map((event, index) => (
              <div key={event.id} className="stagger-item" style={{ animationDelay: `${index * 0.1}s` }}>
                <EventCard event={event} session={session} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 animate-fade-in">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-muted-foreground mb-4">No events found. Try adjusting your filters.</p>
            <Button
              variant="outline"
              onClick={() => {
                setSearchQuery("")
                setSelectedCategory("All")
                setSortBy("date")
                setPriceFilter("all")
              }}
            >
              Reset Filters
            </Button>
          </div>
        )}
      </div>
    </main>
  )
}