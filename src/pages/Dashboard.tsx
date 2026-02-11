import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllProjects, createNewProject, deleteProject } from '@/utils/projectStorage';
import { downloadLyrics } from '@/utils/exportLyrics';
import { LyricsProject } from '@/types/lyrics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, Music2, Clock, Trash2, Search, MoreVertical, FileAudio, Settings2, Download, Edit3, FileText, ExternalLink, Info } from 'lucide-react';

import { formatDistanceToNow } from 'date-fns';
import { Input } from '@/components/ui/input';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

const Dashboard = () => {
    const [projects, setProjects] = useState<LyricsProject[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        setProjects(getAllProjects());
    }, []);

    const handleCreateProject = () => {
        const id = Math.random().toString(36).substring(2, 9);
        const newProject = createNewProject(id);
        navigate(`/editor/${id}`);
    };

    const handleDeleteProject = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        deleteProject(id);
        setProjects(getAllProjects());
        toast.success('Project deleted');
    };

    const filteredProjects = projects
        .filter(p =>
            p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.artist?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    return (
        <div className="min-h-screen bg-background text-foreground p-6 md:p-12">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <Music2 className="h-6 w-6" />
                            </div>
                            <h1 className="text-3xl font-bold tracking-tight">Yosync Studio</h1>
                        </div>
                        <p className="text-muted-foreground text-lg">Create and manage your synchronized lyrics projects.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="lg" onClick={() => navigate('/about')} className="rounded-full px-6">
                            <Info className="mr-2 h-5 w-5" />
                            About
                        </Button>
                        <Button variant="outline" size="lg" onClick={() => navigate('/settings')} className="rounded-full px-6">
                            <Settings2 className="mr-2 h-5 w-5" />
                            Settings
                        </Button>
                        <Button size="lg" onClick={handleCreateProject} className="rounded-full shadow-lg shadow-primary/20 px-8">
                            <PlusCircle className="mr-2 h-5 w-5" />
                            New Project
                        </Button>
                    </div>

                </div>

                {/* Search & Actions */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search projects..."
                            className="pl-10 h-11 bg-muted/50 border-none focus-visible:ring-1"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Projects Grid */}
                {filteredProjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredProjects.map((project) => (
                            <Card
                                key={project.id}
                                className="group cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-muted-foreground/10 h-[220px] flex flex-col"
                                onClick={() => navigate(`/editor/${project.id}`)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
                                            <FileAudio className="h-5 w-5" />
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="w-48">
                                                <DropdownMenuItem onClick={() => navigate(`/editor/${project.id}`)}>
                                                    <Edit3 className="h-4 w-4 mr-2" />
                                                    Edit Project
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={(e) => {
                                                    e.stopPropagation();
                                                    downloadLyrics(project, 'lrc');
                                                    toast.success('Downloaded LRC');
                                                }}>
                                                    <Download className="h-4 w-4 mr-2" />
                                                    Download LRC
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                                                    onClick={(e) => handleDeleteProject(e, project.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                    Delete Project
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                    <CardTitle className="line-clamp-1 group-hover:text-primary transition-colors">{project.title}</CardTitle>
                                    <CardDescription className="line-clamp-1">{project.artist || 'No Artist'}</CardDescription>
                                </CardHeader>
                                <CardContent className="flex-1 pb-2">
                                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <span className="bg-muted px-1.5 py-0.5 rounded">{project.lines.length} lines</span>
                                        <span>•</span>
                                        <span>{project.language.toUpperCase()}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="pt-0 pb-4 flex items-center text-[11px] text-muted-foreground">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Edited {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                                </CardFooter>
                            </Card>
                        ))}

                        {/* Create New Card (Always at the end or start) */}
                        <Card
                            className="group cursor-pointer hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-dashed border-2 border-muted-foreground/20 bg-muted/5 flex flex-col items-center justify-center h-[220px]"
                            onClick={handleCreateProject}
                        >
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 mb-4">
                                <PlusCircle className="h-6 w-6" />
                            </div>
                            <p className="font-medium text-muted-foreground group-hover:text-foreground transition-colors">Create New Project</p>
                        </Card>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-center">
                        <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
                            <Music2 className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">No projects found</h2>
                        <p className="text-muted-foreground max-w-sm mb-8">
                            {searchQuery ? "We couldn't find any projects matching your search." : "Start your musical journey by creating your first synchronized lyrics project."}
                        </p>
                        <Button size="lg" onClick={handleCreateProject}>
                            <PlusCircle className="mr-2 h-5 w-5" />
                            Create Project
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
