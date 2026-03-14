import { useParams, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { motion } from "framer-motion";
import { blogPosts } from "@/data/blog-posts";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

function formatDate(dateStr: string) {
  return new Date(dateStr + "T12:00:00").toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function renderMarkdown(content: string) {
  // Simple markdown-to-JSX renderer for blog content
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 text-muted-foreground">
          {listItems.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  const inlineFormat = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, "<strong class='text-foreground'>$1</strong>")
      .replace(/`(.+?)`/g, "<code class='px-1 py-0.5 rounded bg-muted text-sm font-mono'>$1</code>");
  };

  while (i < lines.length) {
    const line = lines[i].trim();

    if (line === "") {
      flushList();
      i++;
      continue;
    }

    if (line.startsWith("### ")) {
      flushList();
      elements.push(
        <h3 key={`h3-${i}`} className="font-display font-semibold text-lg text-foreground mt-6 mb-2">
          {line.slice(4)}
        </h3>
      );
    } else if (line.startsWith("## ")) {
      flushList();
      elements.push(
        <h2 key={`h2-${i}`} className="font-display font-bold text-xl text-foreground mt-8 mb-3">
          {line.slice(3)}
        </h2>
      );
    } else if (line.startsWith("- ")) {
      listItems.push(line.slice(2));
    } else if (/^\d+\.\s/.test(line)) {
      listItems.push(line.replace(/^\d+\.\s/, ""));
    } else if (line.startsWith("| ")) {
      // Table — collect all table lines
      const tableLines: string[] = [line];
      while (i + 1 < lines.length && lines[i + 1].trim().startsWith("|")) {
        i++;
        tableLines.push(lines[i].trim());
      }
      const headerCells = tableLines[0].split("|").filter(Boolean).map((c) => c.trim());
      const dataRows = tableLines.slice(2); // skip header + separator
      elements.push(
        <div key={`table-${i}`} className="overflow-x-auto my-4">
          <table className="w-full text-sm border border-border rounded-lg">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                {headerCells.map((cell, idx) => (
                  <th key={idx} className="px-4 py-2 text-left font-semibold text-foreground">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dataRows.map((row, rIdx) => {
                const cells = row.split("|").filter(Boolean).map((c) => c.trim());
                return (
                  <tr key={rIdx} className="border-b border-border/50">
                    {cells.map((cell, cIdx) => (
                      <td key={cIdx} className="px-4 py-2 text-muted-foreground">
                        {cell}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    } else if (line.startsWith("```")) {
      // Code block
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      elements.push(
        <pre key={`code-${i}`} className="bg-muted/50 border border-border rounded-lg p-4 overflow-x-auto my-4">
          <code className="text-sm font-mono text-muted-foreground">{codeLines.join("\n")}</code>
        </pre>
      );
    } else {
      flushList();
      elements.push(
        <p
          key={`p-${i}`}
          className="text-muted-foreground leading-relaxed"
          dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
        />
      );
    }

    i++;
  }

  flushList();
  return elements;
}

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find((p) => p.slug === slug);
  const currentIndex = blogPosts.findIndex((p) => p.slug === slug);

  if (!post) {
    return (
      <>
        <div className="container pt-32 pb-16 text-center">
          <h1 className="font-display text-2xl font-bold">Artigo não encontrado</h1>
          <Button variant="outline" asChild className="mt-4">
            <Link to="/blog">Voltar ao blog</Link>
          </Button>
        </div>
      </>
    );
  }

  // Related posts (next 2, wrapping)
  const related = blogPosts
    .filter((p) => p.slug !== slug)
    .slice(0, 3);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: post.title, url });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copiado!" });
    }
  };

  return (
    <>
      <SEOHead title={`${post.title} — TicketHall Blog`} description={post.description} />

      <article className="pt-28 pb-16">
        <div className="container max-w-3xl">
          {/* Back */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Link
              to="/blog"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao blog
            </Link>
          </motion.div>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 mb-8"
          >
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="font-display text-3xl md:text-4xl font-bold leading-tight">
              {post.title}
            </h1>

            <p className="text-muted-foreground text-lg">{post.description}</p>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {formatDate(post.date)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Clock className="h-4 w-4" />
                  {post.readTime}
                </span>
                <span>{post.author}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleShare}>
                <Share2 className="h-4 w-4 mr-1" />
                Compartilhar
              </Button>
            </div>
          </motion.div>

          {/* Cover */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="rounded-xl overflow-hidden border border-border mb-10"
          >
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full aspect-[2/1] object-cover"
            />
          </motion.div>

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-4"
          >
            {renderMarkdown(post.content)}
          </motion.div>
        </div>
      </article>

      {/* Related Posts */}
      <section className="border-t border-border py-12">
        <div className="container max-w-3xl">
          <h2 className="font-display text-xl font-bold mb-6">Leia também</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={`/blog/${r.slug}`}
                className="group rounded-lg border border-border bg-card p-4 space-y-2 hover:border-primary/30 transition-colors"
              >
                <h3 className="font-display text-sm font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {r.title}
                </h3>
                <p className="text-xs text-muted-foreground">{formatDate(r.date)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}
