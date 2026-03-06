import {  Navbar  } from "@/components/navbar"
import {  Card, CardContent, CardHeader  } from "@/components/ui/card"
import {  Button  } from "@/components/ui/button"
import {  getSession  } from "@/lib/session"
import Link from "next/link"
import {  Calendar, User, ArrowRight  } from "lucide-react"

export default async function BlogPage() {
  const session = await getSession()

  const posts = [
    {
      id,
      title: "How to Organize a Successful Hackathon",
      excerpt: "A comprehensive guide for organizers looking to host their first hackathon.",
      author: "Sarah Smith",
      date: "2025-01-15",
      category: "Guide",
    },
    {
      id,
      title: "5 Tips for Getting the Most Out of Tech Workshops",
      excerpt: "Learn how to maximize your learning experience at technical workshops.",
      author: "John Doe",
      date: "2025-01-12",
      category: "Tips",
    },
    {
      id,
      title: "The Future of Educational Events",
      excerpt: "Exploring how technology is transforming the way we learn and network.",
      author: "Alex Kumar",
      date: "2025-01-10",
      category: "Insights",
    },
  ]

  return (
    <main>
      <Navbar session={session} />

      <div className="py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-4 mb-12">
            <h1 className="text-4xl md:text-5xl font-bold">EventifyEDU Blog</h1>
            <p className="text-lg text-muted-foreground">
              Tips, guides, and insights for event organizers and attendees
            </p>
          </div>

          <div className="space-y-6">
            {posts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-2xl font-bold">{post.title}</h3>
                  </div>
                  <p className="text-muted-foreground">{post.excerpt}</p>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {post.author}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(post.date).toLocaleDateString()}
                      </div>
                    </div>
                    <Button variant="ghost" asChild>
                      <Link href={`/blog/${post.id}`}>
                        Read More <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}

