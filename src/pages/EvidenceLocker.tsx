import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../components/common/Button';
import { EvidenceCard } from '../components/EvidenceCard';
import { FolderPlusIcon } from '../components/icons/FolderPlusIcon';
import { useEvidence } from '../contexts/EvidenceContext';
import { useLayout } from '../contexts/LayoutContext';
import { MagnifyingGlassIcon } from '../components/icons/MagnifyingGlassIcon';

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        if (typeof reader.result === 'string') {
            resolve(reader.result.split(',')[1]);
        } else {
            reject(new Error('Failed to read file as a data URL.'));
        }
    };
    reader.onerror = error => reject(error);
});

export const EvidenceLocker: React.FC = () => {
    const { evidence, addEvidence, isLoading: isEvidenceLoading, error: evidenceError } = useEvidence();
    const { setTitle } = useLayout();

    const [title, setTitleState] = useState('');
    const [description, setDescription] = useState('');
    const [location, setLocation] = useState('');
    const [dateOfEvidence, setDateOfEvidence] = useState('');
    const [tags, setTags] = useState('');
    const [file, setFile] = useState<File | null>(null);
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [formSuccess, setFormSuccess] = useState<string | null>(null);
    
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTag, setActiveTag] = useState<string | null>(null);
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

    useEffect(() => {
        setTitle('Public Evidence Locker');
    }, [setTitle]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            // Limit file size to 4MB to avoid exceeding Netlify's 6MB payload limit after Base64 encoding.
            if (selectedFile.size > 4 * 1024 * 1024) { // 4MB limit
                setFormError("File is too large. Please select a file smaller than 4MB.");
                setFile(null);
                e.target.value = ""; // Clear the file input
                return;
            }
            setFile(selectedFile);
            setFormError(null);
        }
    };

    const resetForm = () => {
        setTitleState('');
        setDescription('');
        setLocation('');
        setDateOfEvidence('');
        setTags('');
        setFile(null);
        const fileInput = document.getElementById('evidenceFile') as HTMLInputElement;
        if(fileInput) fileInput.value = '';
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !location || !dateOfEvidence) {
            setFormError('Please fill in all required fields: Title, Location, and Date.');
            setFormSuccess(null);
            return;
        }

        setIsSubmitting(true);
        setFormError(null);
        setFormSuccess(null);

        try {
            let file_content: string | undefined;
            let file_mime_type: string | undefined;

            if (file) {
                file_content = await toBase64(file);
                file_mime_type = file.type;
            }
            
            await addEvidence({
                title,
                description,
                location,
                date_of_evidence: dateOfEvidence,
                tags: tags.split(',').map(t => t.trim()).filter(Boolean),
                file_content,
                file_mime_type,
            });

            setFormSuccess('Evidence submitted successfully!');
            resetForm();
        } catch (err: any) {
            setFormError(err.message || 'Failed to submit evidence. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        evidence.forEach(item => {
            item.tags?.forEach(tag => tagSet.add(tag));
        });
        return Array.from(tagSet).sort();
    }, [evidence]);

    const filteredAndSortedEvidence = useMemo(() => evidence
        .filter(item => {
            const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (item.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTag = activeTag ? item.tags?.includes(activeTag) : true;
            return matchesSearch && matchesTag;
        })
        .sort((a, b) => {
            if (sortOrder === 'newest') {
                return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
            } else {
                return new Date(a.submitted_at).getTime() - new Date(b.submitted_at).getTime();
            }
        }), [evidence, searchTerm, activeTag, sortOrder]);


    return (
        <div>
            <div className="flex items-center mb-6">
                <FolderPlusIcon className="h-8 w-8 text-brand-green-light" />
                <h2 className="text-3xl font-bold text-gray-800 ml-3">Public Evidence Locker</h2>
            </div>
            <p className="text-gray-600 mb-8 max-w-2xl">
                Submit evidence of environmental incidents. This evidence is public and not tied to a specific assessment.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4 sticky top-8">
                        <h3 className="text-lg font-bold text-gray-800 border-b pb-2">Submit New Evidence</h3>
                        {formError && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-3 text-sm" role="alert"><p>{formError}</p></div>}
                        {formSuccess && <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-3 text-sm" role="alert"><p>{formSuccess}</p></div>}
                        
                        <div>
                            <label htmlFor="title" className="block text-sm font-medium text-gray-700">Title*</label>
                            <input type="text" id="title" value={title} onChange={e => setTitleState(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" placeholder="e.g., Illegal dumping in Karura Forest" required/>
                        </div>
                        <div>
                            <label htmlFor="location" className="block text-sm font-medium text-gray-700">Location*</label>
                            <input type="text" id="location" value={location} onChange={e => setLocation(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" placeholder="e.g., Nairobi County" required/>
                        </div>
                        <div>
                            <label htmlFor="dateOfEvidence" className="block text-sm font-medium text-gray-700">Date of Evidence*</label>
                            <input type="date" id="dateOfEvidence" value={dateOfEvidence} onChange={e => setDateOfEvidence(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" required/>
                        </div>
                         <div>
                            <label htmlFor="tags" className="block text-sm font-medium text-gray-700">Tags (comma-separated)</label>
                            <input type="text" id="tags" value={tags} onChange={e => setTags(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" placeholder="e.g., pollution, waste, river"/>
                        </div>
                        <div>
                            <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea id="description" rows={3} value={description} onChange={e => setDescription(e.target.value)} className="mt-1 w-full p-2 border border-gray-300 rounded-md shadow-sm text-sm" placeholder="Provide details about the evidence..."></textarea>
                        </div>
                         <div>
                            <label htmlFor="evidenceFile" className="block text-sm font-medium text-gray-700">Attach File (Image/PDF/Text, max 4MB)</label>
                            <input type="file" id="evidenceFile" onChange={handleFileChange} className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-green-light/10 file:text-brand-green-light hover:file:bg-brand-green-light/20" accept="image/*,.pdf,.txt,.doc,.docx" />
                        </div>
                        <div className="text-right">
                            <Button type="submit" isLoading={isSubmitting} disabled={isSubmitting}>
                                {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
                            </Button>
                        </div>
                    </form>
                </div>
                <div className="lg:col-span-2">
                     <div className="mb-4 flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-grow">
                            <input
                                type="text"
                                placeholder="Search by title or description..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-2 pl-10 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green-light focus:border-brand-green-light"
                                aria-label="Search evidence"
                            />
                            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        </div>
                        <select
                            value={sortOrder}
                            onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest')}
                            className="p-2 border border-gray-300 rounded-md shadow-sm focus:ring-brand-green-light focus:border-brand-green-light bg-white"
                            aria-label="Sort evidence"
                        >
                            <option value="newest">Sort by Newest</option>
                            <option value="oldest">Sort by Oldest</option>
                        </select>
                    </div>

                    <div className="mb-6 flex flex-wrap gap-2 items-center">
                      <span className="text-sm font-medium text-gray-600">Filter by tag:</span>
                        <button onClick={() => setActiveTag(null)} className={`px-3 py-1 text-xs rounded-full transition-colors ${activeTag === null ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>All</button>
                        {allTags.map(tag => (
                            <button key={tag} onClick={() => setActiveTag(tag)} className={`px-3 py-1 text-xs rounded-full transition-colors ${activeTag === tag ? 'bg-brand-green text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>{tag}</button>
                        ))}
                    </div>

                    {isEvidenceLoading ? (
                         <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                            <h4 className="text-lg font-medium text-gray-700">Loading evidence...</h4>
                        </div>
                    ) : evidenceError ? (
                         <div className="text-center py-12 bg-red-50 rounded-lg shadow-sm">
                            <h4 className="text-lg font-medium text-red-700">Failed to load evidence.</h4>
                            <p className="text-red-500 mt-2">{evidenceError}</p>
                        </div>
                    ) : evidence.length > 0 ? (
                        filteredAndSortedEvidence.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {filteredAndSortedEvidence.map(item => (
                                    <EvidenceCard key={item.id} evidence={item} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                                <h4 className="text-lg font-medium text-gray-700">No Evidence Found</h4>
                                <p className="text-gray-500 mt-2">Your search and filter criteria did not match any records.</p>
                            </div>
                        )
                    ) : (
                        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                            <h4 className="text-lg font-medium text-gray-700">The locker is empty.</h4>
                            <p className="text-gray-500 mt-2">Be the first to submit evidence of an environmental concern.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};