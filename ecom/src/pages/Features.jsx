import React from 'react';
import BuildSitesHeader from '../components/BuildSitesHeader';
import FeaturesGrid from '../components/FeaturesGrid';

const Features = () => {
    return (
        <>
            <BuildSitesHeader
                title="Powerful features for"
                highlight="creators"
                description="Everything you need to build faster and better."
            />
            <FeaturesGrid />
        </>
    );
};

export default Features;
