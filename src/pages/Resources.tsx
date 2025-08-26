import React, { useEffect } from 'react';
import { BookOpenIcon } from '../components/icons/BookOpenIcon';
import { useLayout } from '../contexts/LayoutContext';

interface ResourceLinkProps {
  title: string;
  description: string;
  url: string;
}

const ResourceLink: React.FC<ResourceLinkProps> = ({ title, description, url }) => (
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

    useEffect(() => {
        setTitle('Legal & Environmental Resources');
    }, [setTitle]);

    const resources: ResourceLinkProps[] = [
        {
            title: 'National Environment Management Authority (NEMA)',
            description: 'The primary government body in Kenya responsible for the management of the environment, and environmental policy.',
            url: 'https://www.nema.go.ke'
        },
        {
            title: 'Water Resources Authority (WRA)',
            description: 'The state agency responsible for the regulation and management of water resources in Kenya.',
            url: 'https://wra.go.ke/'
        },
        {
            title: 'Kenya Forest Service (KFS)',
            description: 'Manages, conserves, and develops all state and community forests. Essential for projects involving forest land.',
            url: 'http://www.kenyaforestservice.org/'
        },
        {
            title: 'Kenya Wildlife Service (KWS)',
            description: 'The state corporation that conserves and manages wildlife in Kenya, and enforces related laws and regulations.',
            url: 'http://www.kws.go.ke/'
        },
        {
            title: 'Ministry of Environment, Climate Change and Forestry',
            description: 'Official website for the ministry overseeing national environmental and forestry policy.',
            url: 'https://www.environment.go.ke/'
        },
        {
            title: 'Ministry of Mining and Blue Economy',
            description: 'The state ministry managing mineral resources and the development of the blue economy sector, including fisheries and maritime affairs.',
            url: 'https://www.mining.go.ke/'
        },
        {
            title: 'Kenya Law: Environmental Laws',
            description: 'Access the official repository of Kenyan laws, including the Environmental Management and Co-ordination Act (EMCA).',
            url: 'http://kenyalaw.org/kl/index.php?id=398'
        },
        {
            title: 'National Environmental Tribunal',
            description: 'Information about the tribunal established to hear appeals against decisions made by NEMA.',
            url: 'https://net.go.ke/'
        },
        {
            title: 'Law Society of Kenya (LSK)',
            description: 'The premier bar association in Kenya, with resources and committees on environmental law.',
            url: 'https://lsk.or.ke/'
        },
        {
            title: 'Green Belt Movement',
            description: 'An influential environmental NGO empowering communities, particularly women, to conserve the environment and improve livelihoods.',
            url: 'https://www.greenbeltmovement.org/'
        },
    ];

  return (
    <div>
      <div className="flex items-center mb-6">
        <BookOpenIcon className="h-8 w-8 text-brand-green-light" />
        <h2 className="text-3xl font-bold text-gray-800 ml-3">Legal & Environmental Resources</h2>
      </div>
      <p className="text-gray-600 mb-8 max-w-2xl">
        A curated list of essential resources for environmental legal practice in Kenya.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {resources.map((resource, index) => (
              <ResourceLink key={index} {...resource} />
          ))}
      </div>
    </div>
  );
};