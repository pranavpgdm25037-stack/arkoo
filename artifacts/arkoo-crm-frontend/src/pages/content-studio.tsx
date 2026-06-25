import { useState } from "react";
import { motion } from "framer-motion";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  Sparkles, 
  Copy, 
  Check, 
  RefreshCw, 
  Linkedin, 
  Instagram,
  Facebook,
  Twitter,
  Image as ImageIcon,
  Download
} from "lucide-react";

const PLATFORMS = [
  { id: 'linkedin', label: 'LinkedIn', icon: Linkedin },
  { id: 'instagram', label: 'Instagram', icon: Instagram },
  { id: 'facebook', label: 'Facebook', icon: Facebook },
  { id: 'twitter', label: 'Twitter / X', icon: Twitter },
];

const TONES = ['Professional', 'Friendly', 'Bold', 'Informative', 'Celebratory'];
const VISUAL_STYLES = ['Clean/Corporate', 'Bold/Promotional', 'Minimal', 'Festive', 'Cinematic', 'Realistic'];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function ContentStudio() {
  const [platform, setPlatform] = useState('linkedin');
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [keywords, setKeywords] = useState('');
  const [visualStyle, setVisualStyle] = useState('Clean/Corporate');
  
  const [variants, setVariants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const [generatingImages, setGeneratingImages] = useState<Record<number, boolean>>({});
  const [imageErrors, setImageErrors] = useState<Record<number, string>>({});

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError('Add a topic before generating — even a rough sentence works.');
      return;
    }
    setError('');
    setLoading(true);
    setVariants([]);
    setImageErrors({});
    setGeneratingImages({});

    try {
      const res = await fetch('/api/lms/content/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, topic, tone, keywords, variantCount: 3 }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Generation failed. Please try again.');
      }

      const data = await res.json();
      setVariants(data.variants || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong generating content.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (variant: any, index: number) => {
    const fullText = variant.hashtags?.length
      ? `${variant.caption}\n\n${variant.hashtags.map((h: string) => `#${h.replace(/^#/, '')}`).join(' ')}`
      : variant.caption;
    navigator.clipboard.writeText(fullText);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1500);
  };

  const handleGenerateImage = async (variant: any, index: number) => {
    setGeneratingImages(prev => ({ ...prev, [index]: true }));
    setImageErrors(prev => ({ ...prev, [index]: '' }));

    try {
      const res = await fetch('/api/lms/content/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption: variant.caption, platform, visualStyle }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate image.');
      }

      const data = await res.json();
      
      setVariants(prev => {
        const updated = [...prev];
        updated[index] = { ...updated[index], generatedImage: data.image };
        return updated;
      });
    } catch (err: any) {
      setImageErrors(prev => ({ ...prev, [index]: err.message || 'Generation failed.' }));
    } finally {
      setGeneratingImages(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleDownloadImage = (base64String: string, index: number) => {
    const a = document.createElement("a");
    a.href = base64String;
    a.download = `arkoo-creative-variant-${index + 1}.jpg`;
    a.click();
  };

  return (
    <Layout>
      <motion.div 
        className="flex flex-col gap-6 max-w-5xl mx-auto"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants}>
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-8 text-white shadow-lg mb-2">
            <Sparkles className="w-8 h-8 mb-2 opacity-90" />
            <h1 className="text-3xl font-bold tracking-tight mb-2">Content Studio</h1>
            <p className="opacity-90 max-w-2xl">Generate on-brand captions and matching ad creatives for social posts in seconds using AI.</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants}>
          <Card className="border-muted-foreground/20 shadow-sm bg-card">
            <CardContent className="pt-6 space-y-6">
              
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Platform</Label>
                <div className="flex flex-wrap gap-2">
                  {PLATFORMS.map((p) => {
                    const Icon = p.icon;
                    const active = platform === p.id;
                    return (
                      <Button
                        key={p.id}
                        variant={active ? "default" : "outline"}
                        onClick={() => setPlatform(p.id)}
                        className={`gap-2 ${active ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : ''}`}
                      >
                        <Icon className="w-4 h-4" />
                        {p.label}
                      </Button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-semibold">What's the post about?</Label>
                <Textarea
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Announcing our new prefab modular office units, fast turnaround, eco-friendly materials"
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Tone</Label>
                  <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tone" />
                    </SelectTrigger>
                    <SelectContent>
                      {TONES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Keywords (optional)</Label>
                  <Input
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="e.g. sustainable, fast delivery"
                  />
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Visual Style</Label>
                  <Select value={visualStyle} onValueChange={setVisualStyle}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      {VISUAL_STYLES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm font-medium">{error}</p>}

              <Button 
                onClick={handleGenerate} 
                disabled={loading} 
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" /> Generating Captions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" /> Generate Captions
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {variants.length > 0 && (
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {variants.map((variant, index) => (
              <Card key={index} className="flex flex-col h-full border-muted-foreground/20 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/40 pb-4 border-b">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">
                      Variant {index + 1}
                    </span>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleCopy(variant, index)}
                      className="h-8 px-3 text-xs gap-1.5"
                    >
                      {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedIndex === index ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 flex-grow flex flex-col">
                  <div className="flex-grow space-y-4">
                    <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                      {variant.caption}
                    </p>
                    {variant.hashtags?.length > 0 && (
                      <p className="text-sm text-indigo-600 font-medium break-words">
                        {variant.hashtags.map((h: string) => `#${h.replace(/^#/, '')}`).join(' ')}
                      </p>
                    )}
                  </div>

                  <div className="mt-6 pt-6 border-t border-border/50">
                    {variant.generatedImage ? (
                      <div className="space-y-3">
                        <div className="rounded-lg overflow-hidden border border-border bg-muted">
                          <img 
                            src={variant.generatedImage} 
                            alt="Generated Ad Creative" 
                            className="w-full h-auto object-cover"
                          />
                        </div>
                        <Button 
                          variant="secondary" 
                          className="w-full gap-2"
                          onClick={() => handleDownloadImage(variant.generatedImage, index)}
                        >
                          <Download className="w-4 h-4" /> Download Image
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {imageErrors[index] && (
                          <div className="text-xs text-red-500 font-medium mb-2 bg-red-50 dark:bg-red-900/10 p-2 rounded">
                            {imageErrors[index]}
                          </div>
                        )}
                        <Button 
                          variant="outline" 
                          className="w-full gap-2"
                          onClick={() => handleGenerateImage(variant, index)}
                          disabled={generatingImages[index]}
                        >
                          {generatingImages[index] ? (
                            <><RefreshCw className="w-4 h-4 animate-spin" /> Generating Image...</>
                          ) : (
                            <><ImageIcon className="w-4 h-4" /> {imageErrors[index] ? 'Retry Image' : 'Generate Graphic'}</>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </motion.div>
        )}

        {!loading && variants.length === 0 && !error && (
          <motion.div variants={itemVariants} className="text-center py-16 text-muted-foreground border-2 border-dashed border-muted rounded-xl bg-card/30">
            <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p>Fill in a topic above and generate to see caption variants and create graphics.</p>
          </motion.div>
        )}
      </motion.div>
    </Layout>
  );
}
