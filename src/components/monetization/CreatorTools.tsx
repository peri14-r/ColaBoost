import { ExternalLink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const tools = [
  {
    name: 'Canva',
    description: 'Professional design made simple',
    url: 'https://partner.canva.com/c/5428916/647168/10068',
    icon: '🎨',
  },
  {
    name: 'CapCut',
    description: 'Easy video editing for creators',
    url: 'https://www.capcut.com/',
    icon: '🎬',
  },
  {
    name: 'Notion',
    description: 'Organize your creative workflow',
    url: 'https://affiliate.notion.so/sdzpnmztzqy4',
    icon: '📝',
  },
  {
    name: 'Epidemic Sound',
    description: 'Royalty-free music for content',
    url: 'https://www.epidemicsound.com/referral/i3t5dy/',
    icon: '🎵',
  },
];

export function CreatorTools() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Creator Tools</h2>
        <p className="text-muted-foreground">
          Recommended tools to elevate your content creation
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tools.map((tool) => (
          <Card key={tool.name} className="p-6 hover:shadow-glow transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-3xl">{tool.icon}</span>
                  <h3 className="text-lg font-semibold">{tool.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  {tool.description}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => window.open(tool.url, '_blank', 'noopener,noreferrer')}
                >
                  Learn More
                  <ExternalLink className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
