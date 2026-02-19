import { useParams, useNavigate } from 'react-router-dom';
import { getProjectById, createNewProject } from '@/utils/projectStorage';
import { SyncLyricsApp } from '@/components/App';
import { useEffect, useState } from 'react';
import { LyricsProject } from '@/types/lyrics';
import { Loader2 } from 'lucide-react';

const EditorPage = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const navigate = useNavigate();
    const [project, setProject] = useState<LyricsProject | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) {
            navigate('/');
            return;
        }

        const existingProject = getProjectById(projectId);
        if (existingProject) {
            setProject(existingProject);
            setLoading(false);
        } else {
            // If project doesn't exist, create a new one with this ID
            // or redirect back to dashboard. 
            // For now, let's just create it.
            const newP = createNewProject(projectId);
            setProject(newP);
            setLoading(false);
        }
    }, [projectId, navigate]);

    if (loading) {
        return (
            <div className="h-screen w-screen flex items-center justify-center bg-background text-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-lg font-medium">Loading project...</span>
            </div>
        );
    }

    if (!project) return null;

    return <SyncLyricsApp initialProject={project} />;
};

export default EditorPage;
