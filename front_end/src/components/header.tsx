import { useState } from "react"
import { Button } from "@/components/ui/button"
import { FileText, MessageSquare, LinkIcon, Menu, X } from "lucide-react"

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
    setMobileMenuOpen(false)
  }

  return (
    <header className="sticky top-0 z-50 bg-white border-b shadow-sm">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Interviewer
            </h1>
          </div>

          <nav className="hidden md:flex space-x-1">
            <Button
              variant="ghost"
              onClick={() => scrollToSection("upload-section")}
              className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload Resume
            </Button>

            <Button
              variant="ghost"
              onClick={() => scrollToSection("chat-section")}
              className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Interview Chat
            </Button>

            <Button
              variant="ghost"
              onClick={() => scrollToSection("generate-link-section")}
              className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-300"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Generate Link
            </Button>
          </nav>

          <div className="md:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="border-gray-300"
            >
              {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden pt-4 pb-2 space-y-2 animate-in slide-in-from-top duration-300">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection("upload-section")}
              className="w-full justify-start hover:bg-blue-50 hover:text-blue-600"
            >
              <FileText className="mr-2 h-4 w-4" />
              Upload Resume
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection("chat-section")}
              className="w-full justify-start hover:bg-blue-50 hover:text-blue-600"
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Interview Chat
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => scrollToSection("generate-link-section")}
              className="w-full justify-start hover:bg-blue-50 hover:text-blue-600"
            >
              <LinkIcon className="mr-2 h-4 w-4" />
              Generate Link
            </Button>
          </div>
        )}
      </div>
    </header>
  )
}
