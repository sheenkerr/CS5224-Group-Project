import React from 'react';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';

type SetupPanelProps = {
    steps: string[];
    stepsContent: React.ReactNode[];
    isOptional: boolean[];
    onComplete: () => void;
};


function SetupPannel({ steps, stepsContent, isOptional, onComplete }: SetupPanelProps): React.ReactElement {

    const [activeStep, setActiveStep] = React.useState(0);
    const [skipped, setSkipped] = React.useState(new Set<number>());

    const isStepOptional = (step: number) => {
        if (isOptional[step]) {
            return true;
        }
        return false;
    };

    const isStepSkipped = (step: number) => {
        return skipped.has(step);
    };

    const handleNext = () => {
        let newSkipped = skipped;
        if (isStepSkipped(activeStep)) {
            newSkipped = new Set(newSkipped.values());
            newSkipped.delete(activeStep);
        }

        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setSkipped(newSkipped);
    };

    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };

    const handleSkip = () => {
        if (!isStepOptional(activeStep)) {
            // You probably want to guard against something like this,
            // it should never occur unless someone's actively trying to break something.
            throw new Error("You can't skip a step that isn't optional.");
        }

        setActiveStep((prevActiveStep) => prevActiveStep + 1);
        setSkipped((prevSkipped) => {
            const newSkipped = new Set(prevSkipped.values());
            newSkipped.add(activeStep);
            return newSkipped;
        });
    };

    React.useEffect(() => {
        if (activeStep === steps.length) {
            const timer = setTimeout(() => {
                onComplete?.();
            }, 1500);

            return () => clearTimeout(timer);
        }
    }, [activeStep, steps.length, onComplete]);

    return (
        <Box
            sx={{ width: '100%' }}
            className="min-w-lg bg-gray-50 dark:bg-transparent dark:bg-linear-to-br dark:from-[#0f0f1a] dark:to-[#16213e] font-sans transition-colors"
        >
            {/* Stepper */}
            <Box sx={{ px: 4, pt: 4 }}>
                <Stepper activeStep={activeStep}>
                    {steps.map((label, index) => {
                        const stepProps: { completed?: boolean } = {};
                        const labelProps: { optional?: React.ReactNode } = {};
                        if (isStepOptional(index)) {
                            labelProps.optional = (
                                <Typography variant="caption" className="dark:text-gray-400">
                                    Optional
                                </Typography>
                            );
                        }
                        if (isStepSkipped(index)) {
                            stepProps.completed = false;
                        }
                        return (
                            <Step key={label} {...stepProps}>
                                <StepLabel {...labelProps}>
                                    <span className="dark:text-white font-sans font-medium tracking-wide transition-colors">
                                        {label}
                                    </span>
                                </StepLabel>
                            </Step>
                        );
                    })}
                </Stepper>
            </Box>

            {/* Divider */}
            <Box className="mx-6 mt-6 border-t border-gray-200 dark:border-white/10" />

            {/* Content area */}
            {activeStep === steps.length ? (
                <Box sx={{ px: 4, py: 5 }}>
                    <Box className="rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/40 px-6 py-5 mb-6 flex items-center gap-3">
                        <span className="text-green-500 text-xl">✓</span>
                        <Typography className="text-green-800 dark:text-green-300 font-medium font-sans">
                            You are all set up!
                        </Typography>
                    </Box>
                </Box>
            ) : (
                <Box sx={{ px: 4, py: 5 }}>
                    {/* Step indicator */}
                    <Typography
                        variant="caption"
                        className="text-gray-400 dark:text-gray-500 font-sans uppercase tracking-widest"
                        sx={{ mb: 1, display: 'block' }}
                    >
                        Step {activeStep + 1} of {steps.length}
                    </Typography>
                    <Typography
                        variant="h6"
                        className="text-gray-800 dark:text-white font-sans font-semibold"
                        sx={{ mb: 4 }}
                    >
                        {stepsContent[activeStep]}
                    </Typography>

                    {/* Navigation buttons */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 2,
                            pt: 2,
                            borderTop: '1px solid',
                            borderColor: 'rgba(0,0,0,0.08)',
                        }}
                        className="dark:border-white/10"
                    >
                        <Button
                            color="inherit"
                            disabled={activeStep === 0}
                            onClick={handleBack}
                            variant="outlined"
                            sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontFamily: 'inherit',
                                px: 3,
                                py: 1,
                                borderColor: 'rgba(0,0,0,0.15)',
                                '&:disabled': { opacity: 0.35 },
                            }}
                        >
                            <span className="dark:text-white font-sans">Back</span>
                        </Button>

                        <Box sx={{ flex: '1 1 auto' }} />

                        {isStepOptional(activeStep) && (
                            <Button
                                color="inherit"
                                onClick={handleSkip}
                                sx={{
                                    borderRadius: '8px',
                                    textTransform: 'none',
                                    fontFamily: 'inherit',
                                    px: 3,
                                    py: 1,
                                }}
                            >
                                <span className="font-sans text-gray-500 dark:text-gray-400">Skip</span>
                            </Button>
                        )}

                        <Button
                            onClick={handleNext}
                            variant="contained"
                            sx={{
                                borderRadius: '8px',
                                textTransform: 'none',
                                fontFamily: 'inherit',
                                px: 4,
                                py: 1,
                                backgroundColor: '#ff6b35',
                                boxShadow: 'none',
                                '&:hover': {
                                    backgroundColor: '#e85d2a',
                                    boxShadow: '0 4px 12px rgba(255,107,53,0.3)',
                                },
                            }}
                        >
                            <span className="font-sans font-medium">
                                {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
                            </span>
                        </Button>
                    </Box>
                </Box>
            )}
        </Box>
    );
}

export default SetupPannel;
