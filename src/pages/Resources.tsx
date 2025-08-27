import React, { useEffect, useState, useMemo } from 'react';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { useLayout } from '../contexts/LayoutContext';
import { MagnifyingGlassIcon } from '../components/icons/MagnifyingGlassIcon';

interface ResourceLinkProps {
  title: string;
  description: string;
  url: string;
  categories: string[];
}

const ResourceLink: React.FC<Omit<ResourceLinkProps, 'categories'>> = ({ title, description, url }) => (
    <a 
        href={url} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="block bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
    >
        <h3 className="text-lg font-bold text-brand-green-light hover:underline">{title}</h3>
        <p className="text-gray-600 mt-2">{description}</p>
        <p className="text-sm text-gray-400 mt-3">Visit Resource &rarr;</p>
    </a>
);


export const Resources: React.FC = () => {
    const { setTitle } = useLayout();
    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState<string>('All');

    useEffect(() => {
        setTitle('Legal & Environmental Resources');
    }, [setTitle]);

    const allResources: ResourceLinkProps[] = useMemo(() => [
        {
            title: 'National Environment Management Authority (NEMA)',
            description: 'The primary government body in Kenya responsible for the management of the environment, and environmental policy.',
            url: 'https://www.nema.go.ke',
            categories: ['Environmental', 'Climate', 'Social', 'Health']
        },
        {
            title: 'Water Resources Authority (WRA)',
            description: 'The state agency responsible for the regulation and management of water resources in Kenya.',
            url: 'https://wra.go.ke/',
            categories: ['Environmental', 'Health']
        },
        {
            title: 'Kenya Forest Service (KFS)',
            description: 'Manages, conserves, and develops all state and community forests. Essential for projects involving forest land.',
            url: 'http://www.kenyaforestservice.org/',
            categories: ['Environmental', 'Climate']
        },
        {
            title: 'Kenya Wildlife Service (KWS)',
            description: 'The state corporation that conserves and manages wildlife in Kenya, and enforces related laws and regulations.',
            url: 'http://www.kws.go.ke/',
            categories: ['Environmental']
        },
        {
            title: 'Ministry of Environment, Climate Change and Forestry',
            description: 'Official website for the ministry overseeing national environmental and forestry policy.',
            url: 'https://www.environment.go.ke/',
            categories: ['Environmental', 'Climate']
        },
        {
            title: 'Ministry of Mining and Blue Economy',
            description: 'The state ministry managing mineral resources and the development of the blue economy sector, including fisheries and maritime affairs.',
            url: 'https://www.mining.go.ke/',
            categories: ['Environmental', 'Social']
        },
        {
            title: 'Kenya Law: Environmental Laws',
            description: 'Access the official repository of Kenyan laws, including the Environmental Management and Co-ordination Act (EMCA).',
            url: 'http://kenyalaw.org/kl/index.php?id=398',
            categories: ['Environmental']
        },
        {
            title: 'National Environmental Tribunal',
            description: 'Information about the tribunal established to hear appeals against decisions made by NEMA.',
            url: 'https://net.go.ke/',
            categories: ['Environmental']
        },
        {
            title: 'Law Society of Kenya (LSK)',
            description: 'The premier bar association in Kenya, with resources and committees on environmental law.',
            url: 'https://lsk.or.ke/',
            categories: ['Environmental']
        },
        {
            title: 'Green Belt Movement',
            description: 'An influential environmental NGO empowering communities, particularly women, to conserve the environment and improve livelihoods.',
            url: 'https://www.greenbeltmovement.org/',
            categories: ['Environmental', 'Social', 'Climate']
        },
    ], []);

    const resourceCategories = useMemo(() => 
        ['All', ...Array.from(new Set(allResources.flatMap(r => r.categories)))].sort((a,b) => a === 'All' ? -1 : b === 'All' ? 1 : a.localeCompare(b))
    , [allResources]);

    const filteredResources = useMemo(() => {
       return allResources.filter(resource => {
            const matchesCategory = activeCategory === 'All' || resource.categories.includes(activeCategory);
            const matchesSearch = !searchTerm || resource.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                                  resource.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [searchTerm, activeCategory, allResources]);

  return (
    <div>
      <div className="flex items-center mb-6">
        <BookOpenIcon className="h-8 w-8 text-brand-green-light" />
        <h2 className="text-3xl font-bold text-gray-800 ml-3">Legal & Environmental Resources</h2>
      </div>
      <p className="text-gray-600 mb-8 max-w-2xl">
        A curated list of essential resources for environmental legal practice in Kenya.
      </p>

      <div className="mb-6">
        <div className="relative">
            <input
                type="text"
                placeholder="Search resources by title or keyword..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full max-w-lg p-3 pl-10 border border-gray-300 rounded-lg shadow-sm focus:ring-brand-green-light focus:border-brand-green-light"
                aria-label="Search resources"
            />
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>
      
       <div className="mb-8 flex flex-wrap gap-2 items-center">
          <span className="text-sm font-medium text-gray-600">Filter by category:</span>
            {resourceCategories.map(category => (
                <button 
                    key={category} 
                    onClick={() => setActiveCategory(category)} 
                    className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${activeCategory === category ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                    {category}
                </button>
            ))}
        </div>


      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredResources.map((resource) => (
                <ResourceLink key={resource.url} {...resource} />
            ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
            <h4 className="text-lg font-medium text-gray-700">No Resources Found</h4>
            <p className="text-gray-500 mt-2">Your search and filter criteria did not match any resources.</p>
        </div>
      )}
    </div>
  );
};